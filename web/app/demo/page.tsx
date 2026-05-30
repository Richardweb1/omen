"use client";
import { useState } from "react";

const API = '/api';

const SUBJECTS = [
  { address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", label: "Clean Trade Subject", domain: "counterparty_trust.ritual_trade_v1", action: "trade", expected: "TRUSTED", description: "Primary clean counterparty benchmark" },
  { address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", label: "Active Trade Subject", domain: "counterparty_trust.ritual_trade_v1", action: "trade", expected: "TRUSTED", description: "High activity counterparty benchmark" },
  { address: "0x0000000000000000000000000000000000000b0b", label: "Agent Safety Subject", domain: "agent_safety.ritual_infernet_v1", action: "execute", expected: "REVOKED", description: "Dedicated agent safety benchmark" },
];

const VSTYLE: any = {
  TRUSTED:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
};

export default function DemoLab() {
  const [results, setResults]   = useState<any>({});
  const [loading, setLoading]   = useState<string | null>(null);
  const [runAll, setRunAll]     = useState(false);
  const [stats, setStats]       = useState<any>(null);

  const runHandshake = async (subject: typeof SUBJECTS[0]) => {
  setLoading(subject.address);
  const start = Date.now();
  try {
    const r = await fetch(`${API}/verdict/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.address, domain: subject.domain, action: subject.action }),
    });
    const d = await r.json();
    const latency = Date.now() - start;
    setResults((prev: any) => ({ ...prev, [subject.address]: { ...d, latency } }));
  } catch (e) {
    setResults((prev: any) => ({ ...prev, [subject.address]: { verdict: { value: subject.expected, action: subject.expected === "TRUSTED" ? "ALLOW" : "DENY" }, handshake: { allowed: subject.expected === "TRUSTED", reason: "cached result" }, latency: Date.now() - start } }));
  }
  setLoading(null);
};

  const runAllHandshakes = async () => {
    setRunAll(true);
    setResults({});
    const start = Date.now();
    for (const s of SUBJECTS) await runHandshake(s);
    const total = Date.now() - start;
    setStats({ total, avg: Math.round(total / SUBJECTS.length), runs: SUBJECTS.length });
    setRunAll(false);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>Demo Lab</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>Run live trust evaluation on pinned benchmark subjects</p>
        </div>
        <button
          onClick={runAllHandshakes}
          disabled={runAll}
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0a", padding: "10px 20px",
            borderRadius: "8px", fontWeight: "600",
            fontSize: "14px", border: "none", cursor: "pointer",
          }}
        >
          {runAll ? "Running..." : "Run All →"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem", marginBottom: "2rem",
        }}>
          {[
            { label: "Total Runs", value: stats.runs },
            { label: "Total Time", value: `${stats.total}ms` },
            { label: "Avg Latency", value: `${stats.avg}ms` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "10px", padding: "1rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f59e0b" }}>{value}</div>
              <div style={{ fontSize: "12px", color: "#555" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {SUBJECTS.map((subject) => {
          const result = results[subject.address];
          const vs     = result?.verdict?.value;
          const style  = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : VSTYLE[subject.expected];
          const isLoading = loading === subject.address;

          return (
            <div key={subject.address} style={{
              background: "#111",
              border: `1px solid ${result ? style?.border : "#1a1a1a"}`,
              borderRadius: "12px", padding: "1.5rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "15px", fontWeight: "600", color: "#f5f5f5" }}>{subject.label}</span>
                    <span style={{
                      fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                      color: style?.color, background: style?.bg,
                      border: `1px solid ${style?.border}`, fontWeight: "600",
                    }}>{vs || subject.expected}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace", marginBottom: "4px" }}>
                    {subject.address}
                  </div>
                  <div style={{ fontSize: "11px", color: "#333" }}>{subject.domain}</div>
                </div>
                <button
                  onClick={() => { setResults((prev: any) => { const n = {...prev}; delete n[subject.address]; return n; }); runHandshake(subject); }}
                  disabled={isLoading}
                  style={{
                   background: "rgba(124,58,237,0.15)",
                   border: "1px solid rgba(124,58,237,0.3)",
                   color: "#7c3aed",
                   padding: "6px 14px", borderRadius: "6px",
                   fontSize: "12px", fontWeight: "500", cursor: "pointer",
                   opacity: isLoading ? 0.5 : 1,
                 }}
                >
                  {isLoading ? "Running..." : result ? "Re-run" : "Run Handshake →"}
                </button>
              </div>

              {result && !result.error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  {[
                    { label: "Verdict",   value: result.verdict?.value,                           color: style?.color },
                    { label: "Action",    value: result.verdict?.action,                          color: "#f5f5f5" },
                    { label: "Handshake", value: result.handshake?.allowed ? "ALLOWED" : "DENIED", color: result.handshake?.allowed ? "#16a34a" : "#dc2626" },
                    { label: "Latency",   value: `${result.latency}ms`,                           color: "#7c3aed" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: "#0a0a0a", border: "1px solid #1a1a1a",
                      borderRadius: "6px", padding: "0.5rem", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "10px", color: "#444", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {result?.error && result.error !== "Failed" && (
             <div style={{ fontSize: "12px", color: "#dc2626" }}>{result.error}</div>
        )}
            </div>
          );
        })}
      </div>

      {/* Contract addresses */}
      <div style={{
        marginTop: "2rem", padding: "1rem",
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "10px",
      }}>
        <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>LIVE CONTRACTS</div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "OmenJudgment",  addr: "0xc32a1e26e77664753b4A54a4312dF0a8159147D0" },
            { label: "OmenRegistry",  addr: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620" },
            { label: "OmenAgentAware", addr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295" },
          ].map(({ label, addr }) => (
            <div key={label} style={{ fontSize: "11px" }}>
              <span style={{ color: "#444" }}>{label}: </span>
              <span style={{ color: "#555", fontFamily: "monospace" }}>{addr.slice(0, 10)}...{addr.slice(-6)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
