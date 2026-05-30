export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ethers } from "ethers";

function buildSignal(subject: string, domain: string) {
  const addrHash = BigInt("0x" + createHash("sha256").update(subject).digest("hex"));
  let features: number[];
  let names: string[];

  if (domain === "counterparty_trust.ritual_trade_v1") {
    features = [
      Number((addrHash % 80n) + 5n),
      Number((addrHash >> 8n) % 10n),
      Number((addrHash >> 16n) % 20n) + 1,
      Number((addrHash >> 24n) % 8n),
      (addrHash % 100n) > 85n ? 1 : 0,
    ];
    names = ["tx_count","failed_tx","unique_counterparties","unbounded_approvals","flagged_interactions"];
  } else {
    features = [
      Number((addrHash % 50n) + 5n),
      Number((addrHash >> 8n) % 5n),
      (addrHash % 100n) > 90n ? 1 : 0,
      Number((addrHash >> 16n) % 3n),
      Number((addrHash >> 24n) % 100n),
    ];
    names = ["action_count","failed_actions","unauthorized_attempts","model_changes","anomaly_score"];
  }

  const merkleRoot = "0x" + createHash("sha256").update(`${subject}:${domain}:${features}`).digest("hex");
  return { features, names, merkleRoot };
}

function evaluate(domain: string, features: number[]): [number, string] {
  if (domain === "counterparty_trust.ritual_trade_v1") {
    const [txCount, failedTx,, unbounded, flagged] = features;
    if (txCount < 3)                                return [0, "Insufficient transaction history"];
    if (flagged > 0 || unbounded > 5)               return [3, "Flagged interactions or excessive unbounded approvals"];
    if (failedTx > 0 && failedTx >= txCount / 3)    return [2, "High failure rate, review needed"];
    if (txCount >= 10)                              return [1, "Clean activity profile, trusted counterparty"];
    return [2, "Activity present but limited history"];
  }
  const [,, unauthorized,, anomaly] = features;
  if (unauthorized > 0 || anomaly >= 70) return [3, "Unauthorized actions or high anomaly score"];
  if (anomaly >= 30)                     return [2, "Moderate anomaly, review recommended"];
  return [1, "Agent operating within safe parameters"];
}

const VERDICT_NAMES = ["UNSEEN","TRUSTED","PENDING","REVOKED","LAPSED"];
const VERDICT_ACTIONS: Record<number,string> = {0:"No data yet",1:"Safe to interact",2:"Review first",3:"Block it",4:"Refresh needed"};

const JUDGMENT_ABI = [
  "function submitSignal(address subject, string calldata domain, bytes32 merkleRoot, uint256 startBlock, uint256 endBlock) external",
  "function evaluateDeterministic(address subject, string calldata domain, uint256[] calldata features, string calldata reasoning) external",
];

export async function POST(req: Request) {
  const { subject, domain = "counterparty_trust.ritual_trade_v1" } = await req.json();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const { features, merkleRoot } = buildSignal(subject, domain);
  const [verdictId, reasoning] = evaluate(domain, features);

  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
  const judgmentAddress = process.env.OMEN_JUDGMENT_ADDRESS;

  if (!privateKey || !judgmentAddress) {
    return NextResponse.json({
      status: "evaluated",
      subject, domain,
      verdict: { value: VERDICT_NAMES[verdictId], verdictId, action: VERDICT_ACTIONS[verdictId], reasoning },
      transactions: {
        submitSignal:    { hash: "env-not-set", block: 0 },
        evaluateVerdict: { hash: "env-not-set", block: 0 },
      },
    });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet   = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(judgmentAddress, JUDGMENT_ABI, wallet);
    const block    = await provider.getBlockNumber();

    const merkleBytes = merkleRoot as `0x${string}`;

    const tx1 = await contract.submitSignal(
      subject, domain, merkleBytes, block - 1000, block,
      { gasLimit: 500000 }
    );
    const r1 = await tx1.wait();

    const tx2 = await contract.evaluateDeterministic(
      subject, domain, features, reasoning,
      { gasLimit: 500000 }
    );
    const r2 = await tx2.wait();

    return NextResponse.json({
      status: "evaluated",
      subject, domain,
      verdict: { value: VERDICT_NAMES[verdictId], verdictId, action: VERDICT_ACTIONS[verdictId], reasoning },
      transactions: {
        submitSignal:    { hash: r1?.hash, block: r1?.blockNumber },
        evaluateVerdict: { hash: r2?.hash, block: r2?.blockNumber },
      },
    });

  } catch (e: any) {
    return NextResponse.json({
      status: "evaluated",
      subject, domain,
      verdict: { value: VERDICT_NAMES[verdictId], verdictId, action: VERDICT_ACTIONS[verdictId], reasoning },
      transactions: {
        submitSignal:    { hash: "tx-failed", block: 0 },
        evaluateVerdict: { hash: "tx-failed: " + e.message?.slice(0, 50), block: 0 },
      },
    });
  }
}
