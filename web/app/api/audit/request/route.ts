export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ethers } from "ethers";

function buildSignal(subject: string, domain: string) {
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

const AUDIT_GATEWAY_ABI = [
  "function depositFees() external payable",
  "function requestAudit(address subject, string calldata domain, uint256[] calldata features) external payable returns (uint256 auditId)",
  "function getAudit(uint256 auditId) external view returns (address requester, address subject, string memory domain, uint256 requestedAt, bool completed, string memory report)",
];

export async function POST(req: Request) {
  const { subject, domain = "counterparty_trust.ritual_trade_v1" } = await req.json();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const features = buildSignal(subject, domain);

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl     = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
  const auditAddr  = process.env.OMEN_AUDIT_ADDRESS;

  if (!privateKey || !auditAddr) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet   = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(auditAddr, AUDIT_GATEWAY_ABI, wallet);

    // Deposit fees first if needed
    const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
    const ritualWallet  = new ethers.Contract(RITUAL_WALLET, [
      "function balanceOf(address user) external view returns (uint256)",
      "function deposit(uint256 lockDuration) external payable",
    ], wallet);

    const balance = await ritualWallet.balanceOf(wallet.address);
    if (balance < ethers.parseEther("0.05")) {
      const depositTx = await ritualWallet.deposit(10000, { value: ethers.parseEther("0.1") });
      await depositTx.wait();
    }

    // Request audit
    const tx = await contract.requestAudit(subject, domain, features, {
      value: ethers.parseEther("0.01"),
      gasLimit: 5000000,
    });
    const receipt = await tx.wait();

    // Get audit result
    const auditId = 0; // first audit
    const audit   = await contract.getAudit(auditId);

    // Parse signal from report
    const report  = audit[5] || "Audit completed - report pending";
    let signal    = "PENDING";
    if (report.toUpperCase().includes("SEALED")) signal = "SEALED";
    if (report.toUpperCase().includes("REVOKED")) signal = "REVOKED";

    return NextResponse.json({
      subject, domain,
      signal,
      report,
      txHash:  receipt?.hash,
      auditId: auditId,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message?.slice(0, 100) }, { status: 500 });
  }
}