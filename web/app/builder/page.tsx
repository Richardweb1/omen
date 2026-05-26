"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

const API = '/api';

const VERDICT_STYLE: any = {
  SEALED:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
  LAPSED:  { color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)"  },
};

export default function Builder() {
  const { address } = useAccount();
 const [subject, setSubject]   = useState("");

useEffect(() => {
  if (address) setSubject(address);
}, [address]);
  const [domain, setDomain]     = useState("counterparty_trust.ritual_trade_v1");
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState<any>(null);
  const [signal, setSignal]     = useState<any>(null);
  const [verdict, setVerdict]   = useState<any>(null);
  const [mirror, setMirror]     = useState<any>(null);
  const [error, setError]       = useState("");

  const reset = () => {
    setStep(0); setSummary(null); setSignal(null);
    setVerdict(null); setMirror(null); setError("");
  };

  const call = async (url: string, body: any) => {
    const r = await fetch(`${API}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d;
  };

  const step1 = async () => {
    if (!subject) return setError("Enter a wallet address");
    setLoading(true); setError("");
    try {
      const d = await call("/signal/summary", { subject, domain });
      setSummary(d); setStep(1);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const step2 = async () => {
    setLoading(true); setError("");
    try {
      const d = await call("/signal/build", { subject, domain });
      setSignal(d); setStep(2);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const step3 = async () => {
    setLoading(true); setError("");
    try {
      const d = await call("/verdict/evaluate", { subject, domain });
      setVerdict(d); setStep(3);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const step4 = async () => {
    setLoading(true); setError("");
    try {
      const d = await call("/verdict/read", { subject, domain, action: "trade" });
      setMirror(d); setStep(4);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const vs = verdict?.verdict?.value || summary?.preview?.verdict;
  const style = vs ? VERDICT_STYLE[vs] || VERDICT_STYLE.UNSEEN : null;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Signal Builder
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Build reproducible evidence and evaluate a live verdict on Ritual chain
        </p>
      </div>

      {/* Input */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
            SUBJECT ADDRESS
          </label>
          <input
            value={subject}
            onChange={e => { setSubject(e.target.value); reset(); }}
            placeholder="0x..."
            style={{
              width: "100%", background: "#0a0a0a",
              border: "1px solid #222", borderRadius: "8px",
              padding: "10px 14px", color: "#f5f5f5",
              fontSize: "14px", fontFamily: "monospace",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
            DOMAIN
          </label>
          <select
            value={domain}
            onChange={e => { setDomain(e.target.value); reset(); }}
            style={{
              width: "100%", background: "#0a0a0a",
              border: "1px solid #222", borderRadius: "8px",
              padding: "10px 14px", color: "#f5f5f5",
              fontSize: "13px", outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="counterparty_trust.ritual_trade_v1">Counterparty Trust — trade</option>
            <option value="agent_safety.ritual_infernet_v1">Agent Safety — execute</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#dc2626", fontSize: "13px", marginBottom: "1rem",
        }}>{error}</div>
      )}

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        {/* Step 1 */}
        <StepCard
          num="1" title="Build Evidence Summary"
          active={step === 0} done={step > 0}
          onRun={step1} loading={loading && step === 0}
        >
          {summary && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {Object.entries(summary.features).map(([k, v]) => (
                  <div key={k} style={{
                    background: "#0a0a0a", border: "1px solid #222",
                    borderRadius: "6px", padding: "4px 10px", fontSize: "12px",
                  }}>
                    <span style={{ color: "#555" }}>{k}: </span>
                    <span style={{ color: "#f5f5f5" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
                merkle: {summary.merkleRoot?.slice(0, 20)}...
              </div>
            </div>
          )}
        </StepCard>

        {/* Step 2 */}
        <StepCard
          num="2" title="Build SignalObject"
          active={step === 1} done={step > 1}
          onRun={step2} loading={loading && step === 1}
          disabled={step < 1}
        >
          {signal && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              <div>Type: <span style={{ color: "#f5f5f5" }}>{signal.type}</span></div>
              <div>Version: <span style={{ color: "#f5f5f5" }}>{signal.version}</span></div>
              <div>Blocks: <span style={{ color: "#f5f5f5" }}>{signal.blockWindow?.startBlock} → {signal.blockWindow?.endBlock}</span></div>
              <div style={{ marginTop: "0.5rem", padding: "8px", background: "#0a0a0a", borderRadius: "6px", border: "1px solid #222" }}>
                Preview: <span style={{
                  color: style?.color || "#666",
                  fontWeight: "600",
                }}>{signal.readingArtifact?.verdict}</span>
                <span style={{ color: "#555", marginLeft: "8px", fontSize: "11px" }}>
                  {signal.readingArtifact?.reasoning}
                </span>
              </div>
            </div>
          )}
        </StepCard>

        {/* Step 3 */}
        <StepCard
          num="3" title="Evaluate VerdictObject on Ritual"
          active={step === 2} done={step > 2}
          onRun={step3} loading={loading && step === 2}
          disabled={step < 2}
        >
          {verdict && (
            <div>
              <div style={{
                display: "inline-block",
                padding: "6px 16px", borderRadius: "6px",
                fontSize: "14px", fontWeight: "700",
                color: style?.color,
                background: style?.bg,
                border: `1px solid ${style?.border}`,
                marginBottom: "0.75rem",
              }}>
                {verdict.verdict?.value} — {verdict.verdict?.action}
              </div>
              <div style={{ fontSize: "12px", color: "#555" }}>
                {verdict.verdict?.reasoning}
              </div>
              {verdict.transactions && (
                <div style={{ marginTop: "0.75rem", fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
                  <div>tx1: {verdict.transactions.submitSignal?.hash?.slice(0, 20)}...</div>
                  <div>tx2: {verdict.transactions.evaluateVerdict?.hash?.slice(0, 20)}...</div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* Step 4 */}
        <StepCard
          num="4" title="Read from OmenRegistry"
          active={step === 3} done={step > 3}
          onRun={step4} loading={loading && step === 3}
          disabled={step < 3}
        >
          {mirror && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              <div>Verdict: <span style={{ color: style?.color, fontWeight: "600" }}>{mirror.verdict?.value}</span></div>
              <div>Fresh: <span style={{ color: mirror.verdict?.isFresh ? "#16a34a" : "#dc2626" }}>{mirror.verdict?.isFresh ? "Yes" : "No"}</span></div>
              <div style={{ marginTop: "0.5rem", padding: "8px", background: "#0a0a0a", borderRadius: "6px", border: "1px solid #222" }}>
                Handshake: <span style={{ color: mirror.handshake?.allowed ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                  {mirror.handshake?.allowed ? "ALLOWED" : "DENIED"}
                </span>
                <div style={{ color: "#444", fontSize: "11px", marginTop: "2px" }}>{mirror.handshake?.reason}</div>
              </div>
            </div>
          )}
        </StepCard>

      </div>
    </div>
  );
}

function StepCard({ num, title, active, done, onRun, loading, disabled, children }: any) {
  return (
    <div style={{
      background: "#111",
      border: `1px solid ${active ? "rgba(245,158,11,0.3)" : done ? "rgba(22,163,74,0.2)" : "#1a1a1a"}`,
      borderRadius: "12px", padding: "1.25rem",
      opacity: disabled ? 0.4 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: children ? "1rem" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "50%",
            background: done ? "rgba(22,163,74,0.2)" : active ? "rgba(245,158,11,0.2)" : "#1a1a1a",
            border: `1px solid ${done ? "rgba(22,163,74,0.4)" : active ? "rgba(245,158,11,0.4)" : "#333"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: "700",
            color: done ? "#16a34a" : active ? "#f59e0b" : "#555",
          }}>
            {done ? "✓" : num}
          </div>
          <span style={{ fontSize: "14px", fontWeight: "500", color: active ? "#f5f5f5" : done ? "#999" : "#666" }}>
            {title}
          </span>
        </div>
        {(active || done) && !disabled && (
          <button
            onClick={onRun}
            disabled={loading || done}
            style={{
              background: done ? "transparent" : "rgba(245,158,11,0.15)",
              border: `1px solid ${done ? "#333" : "rgba(245,158,11,0.3)"}`,
              color: done ? "#555" : "#f59e0b",
              padding: "6px 14px", borderRadius: "6px",
              fontSize: "12px", fontWeight: "500",
              cursor: done ? "default" : "pointer",
            }}
          >
            {loading ? "Running..." : done ? "Done" : "Run →"}
          </button>
        )}
        {!active && !done && !disabled && (
          <button
            onClick={onRun}
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b", padding: "6px 14px",
              borderRadius: "6px", fontSize: "12px",
              fontWeight: "500", cursor: "pointer",
            }}
          >
            {loading ? "Running..." : "Run →"}
          </button>
        )}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
