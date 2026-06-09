"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [subject, setSubject] = useState("");
  const [domain, setDomain] = useState(trustDomains[0].value);
  const [result, setResult] = useState<TrustResult | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");

  const activeDomain = useMemo(() => getTrustDomain(domain), [domain]);

  const updateSubject = (value: string) => {
    setSubject(value);
    setResult(null);
    setError("");
  };

  const updateDomain = (value: string) => {
    setDomain(value);
    setResult(null);
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
    if (clearResult) setResult(null);

    try {
      const response = await fetch("/api/verdict/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, domain, action: activeDomain.action }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Trust check failed");
      setResult(data as TrustResult);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Trust check failed");
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
  const shouldOfferBuilder =
    Boolean(result) &&
    (resultStatus === "UNSEEN" || resultStatus === "LAPSED" || resultStatus === "PENDING" || !result?.verdict.isFresh || !result?.verdict.hasRecord);

  return (
    <main className="trust-home">
      <section className="trust-shell">
        <div className="trust-hero-panel">
          <div className="trust-hero-copy">
            <p className="mono-kicker">
              <span className={health?.status === "ok" ? "live-dot online" : "live-dot"} />
              OmenRegistry · Ritual 1979 · block {block}
            </p>
            <h1>Check trust before coordinating.</h1>
            <p>
              Read OmenRegistry on Ritual testnet, then build or refresh a registry-backed trust signal with your connected wallet.
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

        <div className="result-grid">
          <section className={`result-card ${statusClass[resultStatus] || "unseen"}`}>
            <div className="panel-heading">
              <span>Trust Signal</span>
              <ShieldCheck size={19} />
            </div>
            <strong>{result?.verdict.value || "UNSEEN"}</strong>
            <p>{result ? result.subject : "Paste an address to read its current OmenRegistry state."}</p>
            <div className="result-meta-grid">
              <div>
                <span>Recommended Action</span>
                <b>{result?.recommendedAction || "Build Signal"}</b>
              </div>
              <div>
                <span>Fresh</span>
                <b>{result ? (result.verdict.isFresh ? "Yes" : "No") : "No"}</b>
              </div>
              <div>
                <span>Source</span>
                <b>{result?.source || "OmenRegistry"}</b>
              </div>
              <div>
                <span>Updated</span>
                <b>{result ? formatTimestamp(result.verdict.timestamp) : "No record"}</b>
              </div>
            </div>
            {result?.explorer && (
              <a className="explorer-link" href={result.explorer} target="_blank" rel="noreferrer">
                View registry <ExternalLink size={15} />
              </a>
            )}
          </section>

          <section className="explain-card">
            <div className="panel-heading">
              <span>Explain Result</span>
              <ArrowRight size={19} />
            </div>
            <p>{result?.explanation || "Omen reads the registry first. If no fresh signal exists, the safe action is to build or refresh the signal before coordinating."}</p>
            <div className="explain-flow">
              <span>Paste Address</span>
              <ArrowRight size={14} />
              <span>Read Registry</span>
              <ArrowRight size={14} />
              <span>{shouldOfferBuilder ? "Build or Refresh" : "Decide"}</span>
            </div>
          </section>
        </div>

        {result?.verdict.hasRecord && <TrustReceiptMinter result={result} />}

        {shouldOfferBuilder && (
          <InlineSignalBuilder
            key={`${subject}:${domain}`}
            subject={subject}
            domain={domain}
            onRecheck={() => readRegistry(false)}
            onActivityRefresh={loadActivity}
          />
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
