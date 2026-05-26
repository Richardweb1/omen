import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    domains: [
      {
        id: "counterparty_trust.ritual_trade_v1",
        name: "Counterparty Trust",
        action: "trade",
        question: "Should this wallet be trusted as a trading counterparty?",
        outcomes: ["SEALED","PENDING","REVOKED","UNSEEN"],
        features: ["tx_count","failed_tx","unique_counterparties","unbounded_approvals","flagged_interactions"],
        network: "ritual",
      },
      {
        id: "agent_safety.ritual_infernet_v1",
        name: "Agent Safety",
        action: "execute",
        question: "Should this Ritual agent be permitted to act autonomously?",
        outcomes: ["SEALED","PENDING","REVOKED","UNSEEN"],
        features: ["action_count","failed_actions","unauthorized_attempts","model_changes","anomaly_score"],
        network: "ritual",
      },
    ],
  });
}