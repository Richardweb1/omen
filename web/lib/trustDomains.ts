export type TrustDomain = {
  value: string;
  label: string;
  action: string;
  features: string[];
  defaults: number[];
};

export const trustDomains: TrustDomain[] = [
  {
    value: "counterparty_trust.ritual_trade_v1",
    label: "Counterparty Trust",
    action: "trade",
    features: ["tx_count", "failed_tx", "unique_counterparties", "unbounded_approvals", "flagged_interactions"],
    defaults: [10, 0, 5, 0, 0],
  },
  {
    value: "agent_safety.ritual_infernet_v1",
    label: "Agent Safety",
    action: "execute",
    features: ["action_count", "failed_actions", "unauthorized_attempts", "model_changes", "anomaly_score"],
    defaults: [10, 0, 0, 0, 10],
  },
];

export function getTrustDomain(value: string) {
  return trustDomains.find((item) => item.value === value) || trustDomains[0];
}
