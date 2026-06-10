"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
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

function displayTrustState(result: TrustResult | null): DisplayTrustState {
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
    return {
      status: "NO TRUST RECORD FOUND",
      description: "No trust signal has been recorded for this address yet.",
      recommendedAction: "Mint unavailable",
      current: "Not applicable",
      lastUpdated: "Never",
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
  const [error, setError] = useState("");

  const activeDomain = useMemo(() => getTrustDomain(domain), [domain]);

  const updateSubject = (value: string) => {
    setSubject(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
    setError("");
  };

  const updateDomain = (value: string) => {
    setDomain(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
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

  const readRegistry = async (clearResult = true) => {
    setLoading(true);
    setError("");
    if (clearResult) {
      setResult(null);
      setAddressActivity(null);
      setAddressActivityError("");
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
  const displayState = displayTrustState(result);
  const shouldOfferBuilder =
    Boolean(result) &&
    (resultStatus === "UNSEEN" || resultStatus === "LAPSED" || resultStatus === "PENDING" || !result?.verdict.isFresh || !result?.verdict.hasRecord);
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

        {shouldOfferBuilder && (
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
