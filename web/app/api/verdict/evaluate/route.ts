import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { ethers } from "ethers";

const VERDICT_NAMES = ["UNSEEN", "TRUSTED", "PENDING", "REVOKED", "LAPSED"] as const;
const VERDICT_ACTIONS: Record<number, string> = {
  0: "Build Signal",
  1: "Execute",
  2: "Review First",
  3: "Deny",
  4: "Build Signal",
};

function evaluate(domain: string, features: number[]): [number, string] {
  if (domain === "counterparty_trust.ritual_trade_v1") {
    const [txCount, failedTx, , unbounded, flagged] = features;
    if (txCount < 3) return [0, "Insufficient transaction history"];
    if (flagged > 0 || unbounded > 5) return [3, "Flagged interactions or excessive unbounded approvals"];
    if (failedTx > 0 && failedTx >= txCount / 3) return [2, "High failure rate, review needed"];
    if (txCount >= 10) return [1, "Clean activity profile, trusted counterparty"];
    return [2, "Activity present but limited history"];
  }

  const [, , unauthorized, , anomaly] = features;
  if (unauthorized > 0 || anomaly >= 70) return [3, "Unauthorized actions or high anomaly score"];
  if (anomaly >= 30) return [2, "Moderate anomaly, review recommended"];
  return [1, "Agent operating within safe parameters"];
}

function parseFeatures(features: unknown) {
  if (!Array.isArray(features) || features.length !== 5) {
    throw new Error("five evidence feature values required");
  }

  return features.map((value) => {
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue < 0) {
      throw new Error("features must be non-negative integers");
    }
    return numberValue;
  });
}

export async function POST(req: Request) {
  try {
    const { subject, domain = "counterparty_trust.ritual_trade_v1", features } = await req.json();
    if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });
    if (!ethers.isAddress(subject)) return NextResponse.json({ error: "invalid address" }, { status: 400 });

    const parsedFeatures = parseFeatures(features);
    const [verdictId, reasoning] = evaluate(domain, parsedFeatures);
    const blockResponse = await fetch(process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    });
    const blockData = await blockResponse.json();
    const endBlock = Number.parseInt(blockData.result || "0x0", 16);
    const startBlock = Math.max(0, endBlock - 1000);
    const merkleRoot =
      "0x" + createHash("sha256").update(`${subject}:${domain}:${startBlock}:${endBlock}:${parsedFeatures.join(",")}`).digest("hex");

    return NextResponse.json({
      status: "prepared",
      subject,
      domain,
      verdict: {
        value: VERDICT_NAMES[verdictId],
        verdictId,
        action: VERDICT_ACTIONS[verdictId],
        reasoning,
      },
      txData: {
        merkleRoot,
        features: parsedFeatures,
        reasoning,
        startBlock,
        endBlock,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "evaluation preparation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
