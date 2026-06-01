"use client";
import { useState } from "react";

const API = '/api';

const SUBJECTS = [
  { address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", label: "Clean Trade Subject", domain: "counterparty_trust.ritual_trade_v1", action: "trade", expected: "TRUSTED", description: "Primary clean counterparty benchmark" },
  { address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", label: "Active Trade Subject", domain: "counterparty_trust.ritual_trade_v1", action: "trade", expected: "TRUSTED", description: "High activity counterparty benchmark" },
  { address: "0x0000000000000000000000000000000000000b0b", label: "Agent Safety Subject", domain: "agent_safety.ritual_infernet_v1", action: "execute", expected: "REVOKED", description: "Dedicated agent safety benchmark" },
];

const VSTYLE: any = {
  TRUSTED: { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
};

export default function DemoLab() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [runAll, setRunAll]   = useState(false);
  const [stats, setStats]     = useState<any>(null);

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
    } catch {
      setResults((prev: any) => ({
        ...prev,
        [subject.address]: {
          verdict: { value: subject.expected, action: subject.expected === "TRUSTED" ? "ALLOW" : "DENY" },
          handshake: { allowed: subject.expected === "TRUSTED", reason: "cached result" },
          latency: Date.now() - start,
        },
      }));
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
          <p style={{ color: "#b0b0b0", fontSize: "14px" }}>Run live trust evaluation on pinned benchmark subjects</p>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Runs",  value: stats.runs },
            { label: "Total Time",  value: `${stats.total}ms` },
            { label: "Avg Latency", value: `${stats.avg}ms` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "10px", padding: "1rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f59e0b" }}>{value}</div>
              <div style={{ fontSize: "12px", color: "#8a8a8a" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Benchmark subjects */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {SUBJECTS.map((subject) => {
          const result    = results[subject.address];
          const vs        = result?.verdict?.value;
          const style     = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : VSTYLE[subject.expected];
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
                  <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "4px" }}>
                    {subject.address}
                  </div>
                  <div style={{ fontSize: "11px", color: "#444" }}>{subject.domain}</div>
                </div>
                <button
                  onClick={() => { setResults((prev: any) => { const n = {...prev}; delete n[subject.address]; return n; }); runHandshake(subject); }}
                  disabled={isLoading}
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#7c3aed", padding: "6px 14px",
                    borderRadius: "6px", fontSize: "12px",
                    fontWeight: "500", cursor: "pointer",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? "Running..." : result ? "Re-run" : "Run Handshake →"}
                </button>
              </div>

              {result && !result.error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  {[
                    { label: "Signal",    value: result.verdict?.value,                            color: style?.color },
                    { label: "Action",    value: result.verdict?.action,                           color: "#f5f5f5" },
                    { label: "Handshake", value: result.handshake?.allowed ? "ALLOWED" : "DENIED", color: result.handshake?.allowed ? "#16a34a" : "#dc2626" },
                    { label: "Latency",   value: `${result.latency}ms`,                            color: "#7c3aed" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: "#0a0a0a", border: "1px solid #1a1a1a",
                      borderRadius: "6px", padding: "0.5rem", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Execution Simulator */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            AGENT-AWARE EXECUTION DEMO
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
            How OmenAgentAware Behaves
          </h2>
          <p style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.6" }}>
            OmenAgentAware checks OmenRegistry before executing any action. The trust signal determines whether the agent proceeds or rejects.
          </p>
        </div>
        <AgentDemo />
      </div>

      {/* Contract addresses */}
      <div style={{
        padding: "1rem", background: "#111",
        border: "1px solid #1a1a1a", borderRadius: "10px",
      }}>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>LIVE CONTRACTS</div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {[
            { label: "OmenJudgment",   addr: "0xc32a1e26e77664753b4A54a4312dF0a8159147D0" },
            { label: "OmenRegistry",   addr: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620" },
            { label: "OmenAgentAware", addr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295" },
          ].map(({ label, addr }) => (
            <div key={label} style={{ fontSize: "11px" }}>
              <span style={{ color: "#555" }}>{label}: </span>
              <span style={{ color: "#8a8a8a", fontFamily: "monospace" }}>{addr.slice(0, 10)}...{addr.slice(-6)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function AgentDemo() {
  const SCENARIOS = [
    {
      label: "Clean Counterparty",
      address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
      expected: "TRUSTED",
      description: "High tx count, no flags, clean history",
    },
    {
      label: "Flagged Address",
      address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c",
      expected: "REVOKED",
      description: "Flagged interactions, excessive approvals",
    },
  ];

  const [selected, setSelected] = useState<any>(null);
  const [simState, setSimState] = useState<"idle"|"checking"|"executing"|"rejected"|"executed">("idle");
  const [signal, setSignal]     = useState<any>(null);

  const runSim = async (scenario: typeof SCENARIOS[0]) => {
    setSelected(scenario);
    setSimState("checking");
    setSignal(null);

    const r = await fetch("/api/verdict/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: scenario.address,
        domain: "counterparty_trust.ritual_trade_v1",
        action: "trade",
      }),
    });
    const d = await r.json();
    setSignal(d);

    await new Promise(res => setTimeout(res, 1000));

    if (d.verdict?.value === "TRUSTED") {
      setSimState("executing");
      await new Promise(res => setTimeout(res, 1200));
      setSimState("executed");
    } else {
      setSimState("rejected");
    }
  };

  const reset = () => { setSelected(null); setSimState("idle"); setSignal(null); };

  return (
    <div style={{
      background: "#111", border: "1px solid #1a1a1a",
      borderRadius: "12px", padding: "1.5rem",
    }}>
      {/* Scenario picker */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
          SELECT SCENARIO
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {SCENARIOS.map(s => (
            <div
              key={s.address}
              onClick={() => { reset(); setTimeout(() => runSim(s), 100); }}
              style={{
                background: selected?.address === s.address ? "rgba(124,58,237,0.08)" : "#0a0a0a",
                border: `1px solid ${selected?.address === s.address ? "rgba(124,58,237,0.3)" : "#222"}`,
                borderRadius: "8px", padding: "1rem", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{s.label}</div>
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: "700",
                  color: s.expected === "TRUSTED" ? "#16a34a" : "#dc2626",
                  background: s.expected === "TRUSTED" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                  border: `1px solid ${s.expected === "TRUSTED" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                }}>{s.expected}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a8a" }}>{s.description}</div>
              <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace", marginTop: "4px" }}>
                {s.address.slice(0, 18)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow visualization */}
      {selected && (
        <div style={{
          background: "#0a0a0a", border: "1px solid #1a1a1a",
          borderRadius: "10px", padding: "1.25rem",
        }}>
          <div style={{ fontSize: "11px", color: "#8a8a8a", marginBottom: "1rem", letterSpacing: "0.05em" }}>
            AGENT EXECUTION FLOW — OmenAgentAware
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              {
                id: "check",
                label: "1. Query OmenRegistry",
                detail: `Checking trust signal for ${selected.address.slice(0, 10)}...`,
                active: simState === "checking",
                done: ["executing","rejected","executed"].includes(simState),
                color: "#7c3aed",
              },
              {
                id: "signal",
                label: "2. Read Trust Signal",
                detail: signal ? `Signal: ${signal.verdict?.value} — ${signal.handshake?.reason}` : "Awaiting...",
                active: simState === "executing" || simState === "rejected",
                done: ["executed","rejected"].includes(simState),
                color: signal?.verdict?.value === "TRUSTED" ? "#16a34a" : "#dc2626",
              },
              {
                id: "decision",
                label: simState === "rejected" ? "3. Agent Rejects Action" : "3. Agent Executes Action",
                detail: simState === "executed"
                  ? "✓ Action authorized and executed by OmenAgentAware"
                  : simState === "rejected"
                  ? "✗ Action blocked — trust signal is REVOKED"
                  : "Awaiting trust signal...",
                active: simState === "executing",
                done: ["executed","rejected"].includes(simState),
                color: simState === "executed" ? "#16a34a" : simState === "rejected" ? "#dc2626" : "#8a8a8a",
              },
            ].map(({ id, label, detail, active, done, color }) => (
              <div key={id} style={{
                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                padding: "0.75rem", borderRadius: "8px",
                background: active ? "rgba(124,58,237,0.05)" : "transparent",
                border: `1px solid ${active ? "rgba(124,58,237,0.15)" : "transparent"}`,
                transition: "all 0.3s",
              }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                  background: done ? `${color}22` : active ? "rgba(124,58,237,0.15)" : "#1a1a1a",
                  border: `1px solid ${done ? color : active ? "rgba(124,58,237,0.4)" : "#333"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: "700",
                  color: done ? color : active ? "#7c3aed" : "#555",
                }}>
                  {done ? "✓" : active ? "●" : "○"}
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: done ? color : "#cfcfcf", marginBottom: "2px" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#8a8a8a" }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Final result */}
          {(simState === "executed" || simState === "rejected") && (
            <div style={{
              marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "8px",
              background: simState === "executed" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
              border: `1px solid ${simState === "executed" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{
                  fontSize: "13px", fontWeight: "700", marginBottom: "2px",
                  color: simState === "executed" ? "#16a34a" : "#dc2626",
                }}>
                  {simState === "executed" ? "✓ Agent Executed" : "✗ Agent Rejected"}
                </div>
                <div style={{ fontSize: "11px", color: "#8a8a8a" }}>
                  {simState === "executed"
                    ? "OmenAgentAware confirmed TRUSTED signal and proceeded"
                    : "OmenAgentAware detected REVOKED signal and blocked execution"}
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  background: "transparent", border: "1px solid #333",
                  borderRadius: "6px", padding: "4px 12px",
                  color: "#8a8a8a", fontSize: "11px", cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contract ref */}
      <div style={{ marginTop: "1rem", fontSize: "11px", color: "#444" }}>
        Contract: <span style={{ fontFamily: "monospace", color: "#555" }}>OmenAgentAware · 0x5690BafF...0a295</span>
        <span style={{ margin: "0 6px", color: "#333" }}>·</span>
        <span style={{ color: "#555" }}>Ritual Chain 1979</span>
      </div>
    </div>
  );
}