export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ethers } from "ethers";

function buildFeatures(subject: string, domain: string) {
  const addrHash = BigInt("0x" + createHash("sha256").update(subject).digest("hex"));
  if (domain === "counterparty_trust.ritual_trade_v1") {
    return [
      Number((addrHash % 80n) + 5n),
      Number((addrHash >> 8n) % 10n),
      Number((addrHash >> 16n) % 20n) + 1,
      Number((addrHash >> 24n) % 8n),
      (addrHash % 100n) > 85n ? 1 : 0,
    ];
  }
  return [
    Number((addrHash % 50n) + 5n),
    Number((addrHash >> 8n) % 5n),
    (addrHash % 100n) > 90n ? 1 : 0,
    Number((addrHash >> 16n) % 3n),
    Number((addrHash >> 24n) % 100n),
  ];
}

const LLM_ABI = [
  "function evaluateWithLLM(address subject, string calldata domain, uint256[] calldata features, string calldata reasoning) external",
  "function getVerdict(address subject, string calldata domain) external view returns (uint8 verdict, uint256 evaluatedAt, uint256 revision, string memory reasoning, string memory attestation, bool llmEvaluated)",
];

const VERDICT_NAMES = ["UNSEEN", "TRUSTED", "PENDING", "REVOKED", "LAPSED"];

export async function POST(req: Request) {
  const { subject, domain = "counterparty_trust.ritual_trade_v1" } = await req.json();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const features = buildFeatures(subject, domain);
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
  const llmAddress = "0x4d6f86B615e4B793B43BCd9868D0E3cBD7b64947";

  if (!privateKey) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(llmAddress, LLM_ABI, wallet);

    // Deposit to RitualWallet for EOA if needed
    const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
    const rw = new ethers.Contract(RITUAL_WALLET, [
      "function balanceOf(address) view returns (uint256)",
      "function deposit(uint256) external payable",
    ], wallet);

    const rwBalance = await rw.balanceOf(wallet.address);
    if (rwBalance < ethers.parseEther("0.05")) {
      const walletBalance = await provider.getBalance(wallet.address);
      if (walletBalance > ethers.parseEther("0.05")) {
        const depositTx = await rw.deposit(5000, { value: ethers.parseEther("0.05") });
        await depositTx.wait();
      }
    }

    // Call evaluateWithLLM
    const tx = await contract.evaluateWithLLM(
      subject, domain, features, "deep audit request",
      { gasLimit: 5000000 }
    );
    const receipt = await tx.wait();

    // Read result
    const result = await contract.getVerdict(subject, domain);
    const signal = VERDICT_NAMES[result[0]] || "PENDING";
    const reasoning = result[3] || "Evaluation completed";
    const attestation = result[4] || "";

    return NextResponse.json({
      subject, domain, signal,
      report: reasoning,
      attestation,
      txHash: receipt?.hash,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message?.slice(0, 200) }, { status: 500 });
  }
}
