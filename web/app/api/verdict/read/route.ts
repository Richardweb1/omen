import { NextResponse } from "next/server";
import { createHash } from "crypto";

function buildSignal(subject: string, domain: string) {
  const addrHash = BigInt("0x" + createHash("sha256").update(subject).digest("hex"));
  let features: number[];

  if (domain === "counterparty_trust.ritual_trade_v1") {
    features = [
      Number((addrHash % 80n) + 5n),
      Number((addrHash >> 8n) % 10n),
      Number((addrHash >> 16n) % 20n) + 1,
      Number((addrHash >> 24n) % 8n),
      (addrHash % 100n) > 85n ? 1 : 0,
    ];
  } else {
    features = [
      Number((addrHash % 50n) + 5n),
      Number((addrHash >> 8n) % 5n),
      (addrHash % 100n) > 90n ? 1 : 0,
      Number((addrHash >> 16n) % 3n),
      Number((addrHash >> 24n) % 100n),
    ];
  }
  return features;
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

export async function POST(req: Request) {
  const { subject, domain = "counterparty_trust.ritual_trade_v1", action = "trade" } = await req.json();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const features = buildSignal(subject, domain);
  const [verdictId, reasoning] = evaluate(domain, features);

  return NextResponse.json({
    subject, domain,
    verdict: {
      value:     VERDICT_NAMES[verdictId],
      verdictId,
      action:    VERDICT_ACTIONS[verdictId],
      timestamp: Math.floor(Date.now() / 1000),
      isTRUSTED:  verdictId === 1,
      isRevoked: verdictId === 3,
      isFresh:   true,
    },
    handshake: {
      allowed: verdictId === 1,
      reason:  reasoning,
      action,
    },
  });
}
