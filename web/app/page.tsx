"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  ExternalLink,
  FileCode2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { getAddress } from "viem";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import InlineSignalBuilder from "@/components/InlineSignalBuilder";
import TrustReceiptMinter from "@/components/TrustReceiptMinter";
import { getTrustDomain, trustDomains } from "@/lib/trustDomains";

type VerdictValue = "TRUSTED" | "REVOKED" | "PENDING" | "UNSEEN" | "LAPSED";

type Health = {
  status?: string;
  block?: number;
  contracts?: {
    registry?: string;
    judgment?: string;
  };
};

type TrustResult = {
  subject: string;
  domain: string;
  source: "OmenRegistry";
  registry: string;
  explorer: string;
  recommendedAction: string;
  explanation: string;
  verdict: {
    value: VerdictValue;
    rawValue: VerdictValue;
    timestamp: number;
    isFresh: boolean;
    hasRecord: boolean;
  };
  handshake: {
    allowed: boolean;
    reason: string;
    action: string;
  };
};

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

type ActivityResponse = {
  empty: boolean;
  fromBlock?: number;
  toBlock?: number;
  items: ActivityItem[];
};

type AddressActivitySummary = {
  address: string;
  outgoingTxCount: number;
  txCountSource: string;
  txCountLabel: string;
  reliability: string;
  stakeActivity: "Not verified";
  donationActivity: "Not verified";
  swapActivity: "Not verified";
  notes: string;
};

type DisplayTrustState = {
  status: string;
  technicalStatus?: string;
  description: string;
  recommendedAction: string;
  current: string;
  lastUpdated: string;
};

type ContractSourceResponse = {
  address: string;
  chainId: string;
  isContract: boolean;
  verified: boolean;
  contractName?: string;
  compilerVersion?: string;
  sourceCode?: string;
  explorer?: string;
  error?: string;
};

type ContractRiskFinding = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  recommendedFix: string;
};

type ContractRiskResponse = {
  report: {
    overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    agentDecision: "ALLOW" | "REVIEW" | "BLOCK";
    launchRecommendation: string;
    findings: ContractRiskFinding[];
  };
};

const statusClass: Record<VerdictValue | string, string> = {
  TRUSTED: "trusted",
  REVOKED: "revoked",
  PENDING: "pending",
  UNSEEN: "unseen",
  LAPSED: "lapsed",
  REVIEW: "pending",
};

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp: number) {
  if (!timestamp) return "No timestamp";
  const ms = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(ms).toLocaleString();
}

function isLegacyDomainId(domainValue: string) {
  return domainValue.includes("ritual_infernet");
}

function buildRiskReviewMessage(walletAddress: string, timestamp: string, nonce: string) {
  return [
    "Omen Contract Risk Check",
    "",
    "I request a pre-interaction contract risk review.",
    "",
    "This review is not a formal audit guarantee.",
    "",
    `Wallet: ${walletAddress}`,
    `Timestamp: ${timestamp}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

function makeNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function displayTrustState(result: TrustResult | null, selectedDomain: string, activitySummary: AddressActivitySummary | null): DisplayTrustState {
  const isParticipantDomain = selectedDomain === "ritual_testnet_participant_v1";

  if (!result) {
    return {
      status: "READY",
      description: "Paste an address to read its current OmenRegistry state.",
      recommendedAction: "Paste address",
      current: "Waiting",
      lastUpdated: "Waiting",
    };
  }

  if (!result.verdict.hasRecord) {
    if (isParticipantDomain && activitySummary && activitySummary.outgoingTxCount > 0) {
      return {
        status: "RITUAL ACTIVITY FOUND",
        description: "This wallet has Ritual testnet activity, but no Omen participant record yet.",
        recommendedAction: "Create trust record",
        current: "Not recorded",
        lastUpdated: "Never",
      };
    }

    if (isParticipantDomain) {
      return {
        status: "NO PARTICIPANT RECORD YET",
        description: "No OmenRegistry participant record was found for this address.",
        recommendedAction: "Use an active Ritual wallet",
        current: "Not applicable",
        lastUpdated: "Never",
      };
    }

    return {
      status: "NO TRUST RECORD FOUND",
      description: "No trust signal has been recorded for this address yet.",
      recommendedAction: "Mint unavailable",
      current: "Not applicable",
      lastUpdated: "Never",
    };
  }

  if (isParticipantDomain && result.verdict.value === "TRUSTED") {
    return {
      status: "RITUAL PARTICIPANT VERIFIED",
      technicalStatus: "Trusted",
      description: "This wallet has a registry-backed Ritual testnet participant record.",
      recommendedAction: "Mint Trust Receipt",
      current: result.verdict.isFresh ? "Yes" : "No",
      lastUpdated: formatTimestamp(result.verdict.timestamp),
    };
  }

  if (result.verdict.value === "LAPSED" || !result.verdict.isFresh) {
    return {
      status: "TRUST SIGNAL FOUND",
      technicalStatus: "Needs refresh",
      description: "This record exists in OmenRegistry but is no longer fresh.",
      recommendedAction: "Mint Trust Receipt",
      current: "No",
      lastUpdated: formatTimestamp(result.verdict.timestamp),
    };
  }

  if (result.verdict.value === "TRUSTED") {
    return {
      status: "TRUST SIGNAL FOUND",
      technicalStatus: "Trusted",
      description: "This address has a current registry-backed trust signal.",
      recommendedAction: "Mint Trust Receipt",
      current: "Yes",
      lastUpdated: formatTimestamp(result.verdict.timestamp),
    };
  }

  if (result.verdict.value === "REVOKED") {
    return {
      status: "TRUST SIGNAL FOUND",
      technicalStatus: "Revoked",
      description: "This address has a revoked registry-backed trust signal.",
      recommendedAction: result.recommendedAction,
      current: result.verdict.isFresh ? "Yes" : "No",
      lastUpdated: formatTimestamp(result.verdict.timestamp),
    };
  }

  return {
    status: "TRUST SIGNAL FOUND",
    technicalStatus: result.verdict.value,
    description: "This address has a registry-backed trust signal that needs review.",
    recommendedAction: result.recommendedAction,
    current: result.verdict.isFresh ? "Yes" : "No",
    lastUpdated: formatTimestamp(result.verdict.timestamp),
  };
}

export default function Home() {
  const { address: connectedWallet, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const [health, setHealth] = useState<Health | null>(null);
  const [subject, setSubject] = useState("");
  const [domain, setDomain] = useState(trustDomains[0].value);
  const [result, setResult] = useState<TrustResult | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [addressActivity, setAddressActivity] = useState<AddressActivitySummary | null>(null);
  const [addressActivityLoading, setAddressActivityLoading] = useState(false);
  const [addressActivityError, setAddressActivityError] = useState("");
  const [contractSource, setContractSource] = useState<ContractSourceResponse | null>(null);
  const [contractSourceLoading, setContractSourceLoading] = useState(false);
  const [contractSourceError, setContractSourceError] = useState("");
  const [contractRisk, setContractRisk] = useState<ContractRiskResponse | null>(null);
  const [contractRiskLoading, setContractRiskLoading] = useState(false);
  const [contractRiskError, setContractRiskError] = useState("");
  const [error, setError] = useState("");

  const activeDomain = useMemo(() => getTrustDomain(domain), [domain]);

  const updateSubject = (value: string) => {
    setSubject(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
    setContractSource(null);
    setContractSourceError("");
    setContractRisk(null);
    setContractRiskError("");
    setError("");
  };

  const updateDomain = (value: string) => {
    setDomain(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
    setContractRisk(null);
    setContractRiskError("");
    setError("");
  };

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: Health) => setHealth(data))
      .catch(() => undefined);
  }, []);

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const response = await fetch("/api/activity?limit=12");
      const data = (await response.json()) as ActivityResponse;
      setActivity(data);
    } catch {
      setActivity({ empty: true, items: [] });
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/activity?limit=12")
      .then((response) => response.json())
      .then((data: ActivityResponse) => setActivity(data))
      .catch(() => setActivity({ empty: true, items: [] }))
      .finally(() => setActivityLoading(false));
  }, []);

  const loadContractSource = async (address: string) => {
    setContractSourceLoading(true);
    setContractSourceError("");
    setContractSource(null);
    setContractRisk(null);
    setContractRiskError("");

    try {
      const response = await fetch("/api/contract-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (!response.ok || (data.error && !data.isContract)) throw new Error(data.error || "Contract bytecode check failed");
      setContractSource(data as ContractSourceResponse);
    } catch (contractError) {
      setContractSource(null);
      setContractSourceError(contractError instanceof Error ? contractError.message : "Contract bytecode check failed");
    } finally {
      setContractSourceLoading(false);
    }
  };

  const runVerifiedContractRiskCheck = async () => {
    if (!contractSource?.isContract) return;
    if (!contractSource.verified || !contractSource.sourceCode) {
      setContractRiskError(contractSource.error || "Contract source is not verified. Paste Solidity code manually.");
      return;
    }

    setContractRiskLoading(true);
    setContractRiskError("");
    setContractRisk(null);

    try {
      let walletAddress = connectedWallet;
      if (!isConnected || !walletAddress) {
        const connected = await connectAsync({ connector: injected() });
        walletAddress = connected.accounts?.[0];
      }
      if (!walletAddress) throw new Error("Connect wallet to sign the risk check request.");

      const normalizedWallet = getAddress(walletAddress);
      const timestamp = new Date().toISOString();
      const nonce = makeNonce();
      const signedMessage = buildRiskReviewMessage(normalizedWallet, timestamp, nonce);
      const signature = await signMessageAsync({ message: signedMessage });

      const response = await fetch("/api/risk-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractCode: contractSource.sourceCode,
          contractName: contractSource.contractName,
          walletAddress: normalizedWallet,
          signature,
          signedMessage,
          nonce,
          timestamp,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Contract risk check failed");
      setContractRisk(data as ContractRiskResponse);
    } catch (riskError) {
      setContractRiskError(riskError instanceof Error ? riskError.message : "Contract risk check failed");
    } finally {
      setContractRiskLoading(false);
    }
  };

  const readRegistry = async (clearResult = true) => {
    setLoading(true);
    setError("");
    if (clearResult) {
      setResult(null);
      setAddressActivity(null);
      setAddressActivityError("");
      setContractSource(null);
      setContractSourceError("");
      setContractRisk(null);
      setContractRiskError("");
    }

    try {
      const response = await fetch("/api/verdict/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, domain, action: activeDomain.action }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Trust check failed");
      setResult(data as TrustResult);
      void loadContractSource(data.subject || subject);
      setAddressActivityLoading(true);
      setAddressActivityError("");
      try {
        const activityResponse = await fetch(`/api/address-activity?address=${encodeURIComponent(data.subject || subject)}`);
        const activityData = await activityResponse.json();
        if (!activityResponse.ok || activityData.error) throw new Error(activityData.error || "Activity summary unavailable");
        setAddressActivity(activityData as AddressActivitySummary);
      } catch (activityError) {
        setAddressActivity(null);
        setAddressActivityError(activityError instanceof Error ? activityError.message : "Activity summary unavailable");
      } finally {
        setAddressActivityLoading(false);
      }
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Trust check failed");
      setAddressActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const checkTrust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await readRegistry(true);
  };

  const block = health?.block ? health.block.toLocaleString() : "syncing";
  const registry = health?.contracts?.registry || "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";
  const resultStatus = result?.verdict.value || "UNSEEN";
  const isParticipantDomain = domain === "ritual_testnet_participant_v1";
  const participantOutgoingTxCount = addressActivity?.outgoingTxCount || 0;
  const participantCanCreateRecord = Boolean(result && isParticipantDomain && !result.verdict.hasRecord && participantOutgoingTxCount > 0);
  const displayState = displayTrustState(result, domain, addressActivity);
  const shouldOfferBuilder =
    Boolean(result) &&
    !participantCanCreateRecord &&
    (resultStatus === "UNSEEN" || resultStatus === "LAPSED" || resultStatus === "PENDING" || !result?.verdict.isFresh || !result?.verdict.hasRecord);
  const shouldOfferSecondaryBuilder = shouldOfferBuilder && (!isParticipantDomain || Boolean(result?.verdict.hasRecord));
  const receiptGateLabel = (() => {
    if (!result) return "Check trust first";
    if (loading) return "Re-checking registry";
    if (!result.verdict.hasRecord) return "Registry record required";
    return "";
  })();
  const canMintReceipt = Boolean(result) && !receiptGateLabel;

  return (
    <main className="trust-home">
      <section className="trust-shell">
        <div className="trust-hero-panel">
          <div className="trust-hero-copy">
            <p className="mono-kicker">
              <span className={health?.status === "ok" ? "live-dot online" : "live-dot"} />
              OmenRegistry · Ritual · block {block}
            </p>
            <h1>Check trust before coordinating.</h1>
            <p>
              Omen helps users and agents check trust before acting. Read OmenRegistry, understand the result, and mint a Ritual Trust Receipt.
            </p>
          </div>

          <form className="trust-check-card" onSubmit={checkTrust}>
            <div className="field-row">
              <label htmlFor="subject">Address</label>
              <input
                id="subject"
                value={subject}
                onChange={(event) => updateSubject(event.target.value)}
                placeholder="0x... wallet, agent, contract, or autonomous system"
                spellCheck={false}
              />
              <p className="field-hint">Paste an address to check OmenRegistry.</p>
            </div>
            <div className="field-grid">
              <div className="field-row">
                <label htmlFor="domain">Trust Domain</label>
                <select id="domain" value={domain} onChange={(event) => updateDomain(event.target.value)}>
                  {trustDomains.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="trust-submit" type="submit" disabled={loading}>
                {loading ? <RefreshCw size={18} className="spin-icon" /> : <Search size={18} />}
                {loading ? "Checking" : "Check Trust"}
              </button>
            </div>
            <div className="source-strip">
              <Database size={15} />
              Source: OmenRegistry
              <span>{shortAddress(registry)}</span>
            </div>
          </form>
        </div>
        {error && (
          <div className="trust-error" role="alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {result && (
        <div className="result-grid">
          <section className={`result-card ${statusClass[resultStatus] || "unseen"}`}>
            <div className="panel-heading">
              <span>Trust Signal</span>
              <ShieldCheck size={19} />
            </div>
            <strong>{displayState.status}</strong>
            {displayState.technicalStatus && <small className="technical-status-line">Status: {displayState.technicalStatus}</small>}
            <p>{displayState.description}</p>
            <div className="result-meta-grid">
              <div>
                <span>Recommended Action</span>
                <b>{displayState.recommendedAction}</b>
              </div>
              <div>
                <span>Current</span>
                <b>{displayState.current}</b>
              </div>
              <div>
                <span>Source</span>
                <b>{result?.source || "OmenRegistry"}</b>
              </div>
              <div>
                <span>Last updated</span>
                <b>{displayState.lastUpdated}</b>
              </div>
            </div>
            {result?.explorer && (
              <a className="explorer-link" href={result.explorer} target="_blank" rel="noreferrer">
                View registry <ExternalLink size={15} />
              </a>
            )}
          </section>
        </div>
        )}

        {result && (
          <section className="activity-summary-card">
            <div className="panel-heading">
              <span>Activity Summary</span>
              {addressActivityLoading ? <RefreshCw size={16} className="spin-icon" /> : null}
            </div>
            {addressActivity ? (
              <>
                <div className="activity-summary-grid">
                  <div>
                    <span>Outgoing transactions</span>
                    <b>{addressActivity.outgoingTxCount.toLocaleString()}</b>
                  </div>
                  <div>
                    <span>Stake activity</span>
                    <b>{addressActivity.stakeActivity}</b>
                  </div>
                  <div>
                    <span>Donation activity</span>
                    <b>{addressActivity.donationActivity}</b>
                  </div>
                  <div>
                    <span>Swap activity</span>
                    <b>{addressActivity.swapActivity}</b>
                  </div>
                </div>
                <p>
                  Outgoing transactions are read from Ritual RPC using eth_getTransactionCount. This does not include incoming transfers.
                </p>
              </>
            ) : (
              <p>{addressActivityLoading ? "Reading outgoing transaction count from Ritual RPC..." : addressActivityError || "Activity summary unavailable."}</p>
            )}
          </section>
        )}

        {result && contractSourceLoading && (
          <section className="contract-risk-card">
            <div className="panel-heading">
              <span>Contract Detection</span>
              <RefreshCw size={16} className="spin-icon" />
            </div>
            <p>Checking whether this address has smart contract bytecode...</p>
          </section>
        )}

        {result && contractSourceError && (
          <section className="contract-risk-card">
            <div className="panel-heading">
              <span>Contract Detection</span>
              <AlertTriangle size={16} />
            </div>
            <p>{contractSourceError}</p>
          </section>
        )}

        {result && contractSource?.isContract && (
          <section className="contract-risk-card">
            <div className="contract-risk-copy">
              <p className="mono-kicker">
                <ShieldAlert size={15} />
                Smart Contract Detected
              </p>
              <h2>This address appears to be a smart contract.</h2>
              {contractSource.verified ? (
                <p>
                  Verified source was found{contractSource.contractName ? ` for ${contractSource.contractName}` : ""}. Omen can run a gasless
                  Agent Contract Risk Check from this page after a wallet signature.
                </p>
              ) : (
                <p>{contractSource.error || "Contract source is not verified. Paste Solidity code manually."}</p>
              )}
            </div>

            <div className="contract-risk-actions">
              <button
                className="trust-submit"
                type="button"
                onClick={() => void runVerifiedContractRiskCheck()}
                disabled={contractRiskLoading || !contractSource.verified}
              >
                {contractRiskLoading ? <RefreshCw size={18} className="spin-icon" /> : <FileCode2 size={18} />}
                {contractRiskLoading ? "Reviewing contract risk..." : "Check Contract Risk"}
              </button>
              <a className="refresh-button contract-risk-link" href="/risk-check">
                Open Solidity Checker <ExternalLink size={14} />
              </a>
            </div>

            {!contractSource.verified && (
              <div className="contract-risk-note">
                Source code was not fetched or verified. Omen will not run a code-level risk report from bytecode alone.
              </div>
            )}

            {contractRiskError && (
              <div className="trust-error contract-risk-error" role="alert">
                <AlertTriangle size={18} />
                {contractRiskError}
              </div>
            )}

            {contractRisk && (
              <div className="contract-risk-result">
                <div>
                  <span>Agent Decision</span>
                  <b>{contractRisk.report.agentDecision}</b>
                </div>
                <div>
                  <span>Risk</span>
                  <b>{contractRisk.report.overallRisk}</b>
                </div>
                <div className="contract-risk-wide">
                  <span>Recommended action</span>
                  <b>{contractRisk.report.launchRecommendation}</b>
                </div>
                <div className="contract-risk-wide">
                  <span>Main problems</span>
                  {contractRisk.report.findings.length > 0 ? (
                    <ul>
                      {contractRisk.report.findings.slice(0, 3).map((finding, index) => (
                        <li key={`${finding.title}-${index}`}>{finding.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <b>No critical/high issue detected by this review.</b>
                  )}
                </div>
                <details className="contract-risk-wide contract-risk-details">
                  <summary>Technical Details</summary>
                  <pre>{JSON.stringify(contractRisk.report, null, 2)}</pre>
                </details>
              </div>
            )}
          </section>
        )}

        {result?.verdict.hasRecord && (
          <TrustReceiptMinter
            key={`${result.subject}:${result.domain}:${result.verdict.value}:${result.verdict.timestamp}:${result.verdict.isFresh}`}
            result={result}
            canMint={canMintReceipt}
            gateLabel={receiptGateLabel}
            isRechecking={loading}
            onRecheck={() => readRegistry(false)}
            outgoingTxCount={addressActivity?.outgoingTxCount}
          />
        )}

        {participantCanCreateRecord && (
          <InlineSignalBuilder
            key={`${subject}:${domain}:${participantOutgoingTxCount}`}
            subject={subject}
            domain={domain}
            onRecheck={() => readRegistry(false)}
            onActivityRefresh={loadActivity}
          />
        )}

        {shouldOfferSecondaryBuilder && (
          <details className="secondary-refresh-panel">
            <summary>{result?.verdict.hasRecord ? "Refresh registry signal" : "Submit evidence"}</summary>
            <InlineSignalBuilder
              key={`${subject}:${domain}`}
              subject={subject}
              domain={domain}
              onRecheck={() => readRegistry(false)}
              onActivityRefresh={loadActivity}
            />
          </details>
        )}

        <section className="activity-panel">
          <div className="activity-header">
            <div>
              <p className="mono-kicker">Recent Trust Activity</p>
              <h2>Real events only.</h2>
            </div>
            <button type="button" className="refresh-button" onClick={() => void loadActivity()} disabled={activityLoading}>
              <RefreshCw size={16} className={activityLoading ? "spin-icon" : ""} />
              Refresh
            </button>
          </div>

          {activityLoading && <div className="empty-activity">Reading Ritual events...</div>}

          {!activityLoading && (!activity || activity.items.length === 0) && (
            <div className="empty-activity">
              <Activity size={22} />
              No recent trust activity found from OmenRegistry, OmenJudgment, or OmenAgentAware in the current event window.
            </div>
          )}

          {!activityLoading && activity && activity.items.length > 0 && (
            <div className="activity-list">
              {activity.items.map((item) => (
                <a className="activity-row" href={item.explorer} target="_blank" rel="noreferrer" key={item.id}>
                  <div className={`activity-status ${statusClass[item.status] || "unseen"}`}>{item.status}</div>
                  <div>
                    <strong>
                      {item.source} · {item.type}
                    </strong>
                    <span className="activity-domain-line">
                      {shortAddress(item.subject)} · {item.domain}
                      {isLegacyDomainId(item.domain) && (
                        <em title="Domain id retained for deployed contract compatibility. This does not imply active Infernet integration in the current app flow.">
                          legacy domain id
                        </em>
                      )}
                    </span>
                  </div>
                  <div className="activity-tail">
                    <span>#{item.blockNumber.toLocaleString()}</span>
                    <ExternalLink size={14} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
