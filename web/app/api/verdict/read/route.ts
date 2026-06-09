import { NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
const REGISTRY_ADDRESS =
  process.env.OMEN_REGISTRY_ADDRESS || "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";

const REGISTRY_ABI = [
  "function readVerdict(address subject, string calldata domain) external view returns (uint8 verdict, uint256 timestamp, bool isSealed, bool isRevoked, bool isFresh)",
  "function previewHandshake(address subject, string calldata domain, string calldata action) external view returns (bool allowed, string memory reason)",
];

const VERDICT_NAMES = ["UNSEEN", "TRUSTED", "PENDING", "REVOKED", "LAPSED"] as const;

function recommendedAction(verdictId: number, hasRecord: boolean) {
  if (!hasRecord) return "Build Signal";
  if (verdictId === 1) return "Execute";
  if (verdictId === 2) return "Review First";
  if (verdictId === 3) return "Deny";
  if (verdictId === 4) return "Build Signal";
  return "Build Signal";
}

function productReason(value: string, reason: string, hasRecord: boolean, isFresh: boolean) {
  if (!hasRecord) return "No trust signal exists in OmenRegistry for this subject and domain.";
  if (value === "TRUSTED") {
    return isFresh
      ? "TRUSTED: subject is trusted and fresh, so coordination can proceed."
      : "TRUSTED: subject has a trusted registry signal, but it should be refreshed before coordinating.";
  }
  if (value === "LAPSED") return "LAPSED: a trust signal exists in OmenRegistry, but it is no longer fresh.";
  if (value === "REVOKED") return "REVOKED: OmenRegistry contains a revoked signal for this subject.";
  if (value === "PENDING") return "PENDING: OmenRegistry contains an inconclusive signal for this subject.";
  if (reason) return reason.replace(/\bSEALED\b/g, "TRUSTED").replace("subject trusted, allow", "subject is trusted, so coordination can proceed");
  return "OmenRegistry returned no usable trust signal for this subject.";
}

function explanation(value: string, reason: string, hasRecord: boolean) {
  if (!hasRecord) return "No trust signal exists in OmenRegistry for this subject and domain.";
  if (value === "LAPSED") return "A trust signal exists in OmenRegistry, but it is no longer fresh.";
  if (reason) return reason;
  if (value === "TRUSTED") return "OmenRegistry contains a fresh trusted signal for this subject.";
  if (value === "REVOKED") return "OmenRegistry contains a revoked signal for this subject.";
  if (value === "PENDING") return "OmenRegistry contains an inconclusive signal for this subject.";
  return "OmenRegistry returned no usable trust signal for this subject.";
}

export async function POST(req: Request) {
  const { subject, domain = "counterparty_trust.ritual_trade_v1", action = "trade" } = await req.json();

  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });
  if (!ethers.isAddress(subject)) return NextResponse.json({ error: "invalid address" }, { status: 400 });

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const [verdictRaw, timestampRaw, isTrusted, isRevoked, isFresh] = await registry.readVerdict(subject, domain);
    const [allowed, reason] = await registry.previewHandshake(subject, domain, action);

    const rawVerdictId = Number(verdictRaw);
    const timestamp = Number(timestampRaw);
    const hasRecord = timestamp > 0;
    const displayVerdictId = hasRecord && !isFresh ? 4 : rawVerdictId;
    const value = VERDICT_NAMES[displayVerdictId] || "UNSEEN";
    const reasonForUi = productReason(value, reason, hasRecord, Boolean(isFresh));

    return NextResponse.json({
      subject,
      domain,
      source: "OmenRegistry",
      registry: REGISTRY_ADDRESS,
      explorer: `https://explorer.ritualfoundation.org/address/${REGISTRY_ADDRESS}`,
      verdict: {
        value,
        verdictId: displayVerdictId,
        rawValue: VERDICT_NAMES[rawVerdictId] || "UNSEEN",
        rawVerdictId,
        timestamp,
        isTrusted,
        isRevoked,
        isFresh,
        hasRecord,
      },
      recommendedAction: recommendedAction(displayVerdictId, hasRecord),
      explanation: reasonForUi || explanation(value, reason, hasRecord),
      handshake: {
        allowed,
        reason: reasonForUi,
        action,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "registry read failed";
    return NextResponse.json({ error: message.slice(0, 180) }, { status: 500 });
  }
}
