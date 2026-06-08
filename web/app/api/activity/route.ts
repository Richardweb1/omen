import { NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
const REGISTRY_ADDRESS =
  process.env.OMEN_REGISTRY_ADDRESS || "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";
const JUDGMENT_ADDRESS =
  process.env.OMEN_JUDGMENT_ADDRESS || "0xc32a1e26e77664753b4A54a4312dF0a8159147D0";
const AGENT_AWARE_ADDRESS =
  process.env.OMEN_AGENT_AWARE_ADDRESS || "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295";

const VERDICT_NAMES = ["UNSEEN", "TRUSTED", "PENDING", "REVOKED", "LAPSED"] as const;

const REGISTRY_ABI = [
  "event VerdictMirrored(address indexed subject, string domain, uint8 verdict, uint256 timestamp)",
];
const JUDGMENT_ABI = [
  "event VerdictIssued(address indexed subject, string domain, uint8 verdict, uint256 revision, string attestation)",
];
const AGENT_AWARE_ABI = [
  "event HandshakeExecuted(address indexed subject, string domain, string action, bool allowed, string reason)",
];

type ActivityItem = {
  id: string;
  source: "OmenRegistry" | "OmenJudgment" | "OmenAgentAware";
  type: string;
  subject: string;
  domain: string;
  status: string;
  detail: string;
  blockNumber: number;
  txHash: string;
  explorer: string;
};

function label(verdict: unknown) {
  return VERDICT_NAMES[Number(verdict)] || "UNSEEN";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 12), 30);

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const latest = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latest - 100000);

    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const judgment = new ethers.Contract(JUDGMENT_ADDRESS, JUDGMENT_ABI, provider);
    const agentAware = new ethers.Contract(AGENT_AWARE_ADDRESS, AGENT_AWARE_ABI, provider);

    const [registryLogs, judgmentLogs, handshakeLogs] = await Promise.all([
      registry.queryFilter(registry.filters.VerdictMirrored(), fromBlock, latest),
      judgment.queryFilter(judgment.filters.VerdictIssued(), fromBlock, latest),
      agentAware.queryFilter(agentAware.filters.HandshakeExecuted(), fromBlock, latest),
    ]);

    const items: ActivityItem[] = [
      ...registryLogs.map((log) => {
        const event = log as ethers.EventLog;
        return {
          id: `${event.transactionHash}:${event.index}`,
          source: "OmenRegistry" as const,
          type: "Verdict mirrored",
          subject: String(event.args.subject),
          domain: String(event.args.domain),
          status: label(event.args.verdict),
          detail: "Registry trust state updated",
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          explorer: `https://explorer.ritualfoundation.org/tx/${event.transactionHash}`,
        };
      }),
      ...judgmentLogs.map((log) => {
        const event = log as ethers.EventLog;
        return {
          id: `${event.transactionHash}:${event.index}`,
          source: "OmenJudgment" as const,
          type: "Verdict issued",
          subject: String(event.args.subject),
          domain: String(event.args.domain),
          status: label(event.args.verdict),
          detail: `Revision ${String(event.args.revision || "0")}`,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          explorer: `https://explorer.ritualfoundation.org/tx/${event.transactionHash}`,
        };
      }),
      ...handshakeLogs.map((log) => {
        const event = log as ethers.EventLog;
        return {
          id: `${event.transactionHash}:${event.index}`,
          source: "OmenAgentAware" as const,
          type: "Handshake executed",
          subject: String(event.args.subject),
          domain: String(event.args.domain),
          status: event.args.allowed ? "TRUSTED" : "REVIEW",
          detail: String(event.args.reason || "Agent checked registry before acting"),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          explorer: `https://explorer.ritualfoundation.org/tx/${event.transactionHash}`,
        };
      }),
    ]
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);

    return NextResponse.json({
      source: ["OmenRegistry", "OmenJudgment", "OmenAgentAware"],
      fromBlock,
      toBlock: latest,
      empty: items.length === 0,
      items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "activity read failed";
    return NextResponse.json({ error: message.slice(0, 180), items: [], empty: true }, { status: 500 });
  }
}
