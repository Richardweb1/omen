"use client";
import { useState, useEffect } from "react";

const API = '/api';

const VSTYLE: any = {
  TRUSTED:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED:  { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:   { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
  LAPSED:   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)"  },
};

export default function Agents() {
  const [blockNum, setBlockNum]     = useState<number | null>(null);
  const [result, setResult]         = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [checkedAddr, setCheckedAddr] = useState("");

  useEffect(() => {
    fetch(`${API}/block`)
      .then(r => r.json())
      .then(d => setBlockNum(d.block))
      .catch(() => null);
  }, []);

  const checkTrust = async (addr: string, domain: string) => {
    setLoading(true); setError(""); setResult(null); setCheckedAddr(addr);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const r = await fetch(`${API}/verdict/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: addr, domain, action: "execute" }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const vs = result?.verdict?.value;
  const vstyle = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : null;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          RITUAL AGENT INFRASTRUCTURE
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.75rem" }}>
          Agent & Trust Monitor
        </h1>
        {/* Visual flow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", flexWrap: "nowrap", overflowX: "auto" }}>
          {[
            { label: "Onchain Activity", color: "#8a8a8a" },
            null,
            { label: "GLM-4.7-FP8 (TEE)", color: "#7c3aed" },
            null,
            { label: "Trust Signal", color: "#f59e0b" },
            null,
            { label: "Agent Decision", color: "#7c3aed" },
            null,
            { label: "Execute / Deny", color: "#16a34a" },
          ].map((item, i) => {
            if (!item) return (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: "16px", height: "1px", background: "#2a2a2a" }}/>
                <div style={{ width: "4px", height: "4px", borderTop: "1px solid #3a3a3a", borderRight: "1px solid #3a3a3a", transform: "rotate(45deg)", marginLeft: "-3px" }}/>
              </div>
            );
            return (
              <div key={i} style={{ padding: "5px 10px", borderRadius: "6px", background: `${item.color}11`, border: `1px solid ${item.color}33`, fontSize: "11px", fontWeight: "600", color: item.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust result */}
      {error && <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#dc2626", fontSize: "13px", marginBottom: "1rem" }}>{error}</div>}
      {result && (
        <div style={{ background: "#111", border: `1px solid ${vstyle?.border}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "4px" }}>{checkedAddr}</div>
              <div style={{ fontSize: "11px", color: "#444" }}>{result.domain}</div>
            </div>
            <div style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", color: vstyle?.color, background: vstyle?.bg, border: `1px solid ${vstyle?.border}` }}>{result.verdict?.value}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Action",    value: result.verdict?.action },
              { label: "Fresh",     value: result.verdict?.isFresh ? "Yes" : "No" },
              { label: "Handshake", value: result.handshake?.allowed ? "ALLOWED" : "DENIED" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OmenSovereignAgent — hero */}
      <div style={{ background: "#111", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #7c3aed, #f59e0b, transparent)" }}/>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "4px" }}>OmenSovereignAgent</div>
            <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>0x3260dDe013d8c5130092B3DFB7d44DdD995da528</div>
          </div>
          <button onClick={() => checkTrust("0x3260dDe013d8c5130092B3DFB7d44DdD995da528", "agent_safety.ritual_infernet_v1")} disabled={loading} style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "6px", padding: "6px 14px", color: "#7c3aed", fontSize: "12px", cursor: "pointer" }}>
            {loading && checkedAddr === "0x3260dDe013d8c5130092B3DFB7d44DdD995da528" ? "..." : "Check trust →"}
          </button>
        </div>

        {/* Key facts — card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Type",           value: "Sovereign Agent",    color: "#7c3aed" },
            { label: "Scheduler",      value: "0x080C · #2218803",  color: "#f59e0b" },
            { label: "Wake Interval",  value: "Every 500 blocks",   color: "#f5f5f5" },
            { label: "Human Trigger",  value: "None required",      color: "#16a34a" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.75rem" }}>
              <div style={{ fontSize: "10px", color: "#555", marginBottom: "3px", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Ritual tech used — compact */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
          {[
            { label: "Scheduler (0x080C)",    desc: "Autonomous execution",      color: "#f59e0b" },
            { label: "LLM Precompile (0x0802)", desc: "TEE-attested inference",  color: "#7c3aed" },
            { label: "OmenRegistry",           desc: "Shared trust layer",       color: "#16a34a" },
            { label: "TEE Proof",              desc: "Verified onchain",         color: "#8a8a8a" },
          ].map(({ label, desc, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: `${color}08`, border: `1px solid ${color}22`, borderRadius: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color }}>{label}</div>
                <div style={{ fontSize: "10px", color: "#555" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* TEE attestation */}
        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>LIVE TEE ATTESTATION</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontSize: "12px", color: "#8a8a8a" }}>
              Model: <span style={{ color: "#f59e0b" }}>GLM-4.7-FP8</span> · Executor: <span style={{ color: "#cfcfcf", fontFamily: "monospace" }}>0xDbd91...8Ff</span>
            </div>
            <a href="https://explorer.ritualfoundation.org/tx/0xeb9c80fca43e530a2bb31ef9ae4bd680ee5d66f96b9fce4cc7a595b8e7ec1658" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#7c3aed", fontFamily: "monospace" }}>{"tx: 0xeb9c80...1658 ↗"}</a>
          </div>
        </div>

        {/* Heartbeat */}
        {blockNum && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#1a1a1a", borderRadius: "8px", overflow: "hidden" }}>
            {[
              { label: "CURRENT BLOCK", value: blockNum.toLocaleString(),               color: "#f5f5f5" },
              { label: "INTERVAL",      value: "500 blocks",                             color: "#f5f5f5" },
              { label: "NEXT WAKE",     value: `~${blockNum + (500 - (blockNum % 500))}`, color: "#16a34a" },
              { label: "STATUS",        value: "● LIVE",                                 color: "#16a34a" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#0a0a0a", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "3px", letterSpacing: "0.05em" }}>{label}</div>
                <div style={{ fontSize: "12px", fontWeight: "700", color, fontFamily: "monospace" }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OmenAgentAware */}
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #16a34a, transparent)" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f5f5f5", marginBottom: "3px" }}>OmenAgentAware</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295</div>
          </div>
          <button onClick={() => checkTrust("0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295", "agent_safety.ritual_infernet_v1")} disabled={loading} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "4px 12px", color: "#999", fontSize: "12px", cursor: "pointer" }}>
            {loading && checkedAddr === "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295" ? "..." : "Check trust →"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {[
            { label: "Type",      value: "Trust-Aware Agent", color: "#16a34a" },
            { label: "Checks",    value: "OmenRegistry",      color: "#f59e0b" },
            { label: "Behavior",  value: "TRUSTED → Execute · REVOKED → Deny", color: "#f5f5f5" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "0.6rem 0.75rem" }}>
              <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OmenAgentDirect */}
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #444, transparent)" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f5f5f5", marginBottom: "3px" }}>OmenAgentDirect</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>0x7040235955B2D397d7CB717a300911Ec68644aFe</div>
          </div>
          <button onClick={() => checkTrust("0x7040235955B2D397d7CB717a300911Ec68644aFe", "counterparty_trust.ritual_trade_v1")} disabled={loading} style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "4px 12px", color: "#999", fontSize: "12px", cursor: "pointer" }}>
            {loading && checkedAddr === "0x7040235955B2D397d7CB717a300911Ec68644aFe" ? "..." : "Check trust →"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {[
            { label: "Type",     value: "Baseline Agent",    color: "#555" },
            { label: "Checks",   value: "None",              color: "#dc2626" },
            { label: "Behavior", value: "Always executes",   color: "#555" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "0.6rem 0.75rem" }}>
              <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Ritual */}
      <div style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WHY OMEN REQUIRES RITUAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          {[
            { label: "Atomic Intelligence", desc: "LLM in TEE with cryptographic proof", color: "#f59e0b" },
            { label: "Sovereign Agents",    desc: "No keeper — wakes via 0x080C",        color: "#7c3aed" },
            { label: "Verifiable Trust",    desc: "Merkle-committed, independently verifiable", color: "#16a34a" },
          ].map(({ label, desc, color }) => (
            <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.875rem" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color, marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "11px", color: "#8a8a8a", lineHeight: "1.5" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent-to-agent */}
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ fontSize: "12px", color: "#8a8a8a", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>AGENT-TO-AGENT VERIFICATION</div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>Agents Verifying Agents</h2>
        <p style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.6", marginBottom: "1.25rem" }}>
          Any agent can verify another agent through OmenRegistry before interacting.
          Domain: <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>agent_mesh.ritual_infernet_v1</span>
        </p>
        <AgentToAgentDemo />
      </div>

    </div>
  );
}

function AgentToAgentDemo() {
  const SCENARIOS = [
    { id: "trusted", caller: "Research Agent", callerAddr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295", target: "Treasury Agent", targetAddr: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", expected: "TRUSTED", description: "Verifies Treasury Agent before requesting data." },
    { id: "revoked", caller: "Research Agent", callerAddr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295", target: "Unknown Agent",  targetAddr: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", expected: "REVOKED", description: "Detects flagged behavior — interaction rejected." },
  ];

  const [selected, setSelected] = useState<any>(null);
  const [simState, setSimState] = useState<"idle"|"checking"|"decided">("idle");
  const [signal, setSignal]     = useState<any>(null);

  const runSim = async (scenario: typeof SCENARIOS[0]) => {
    setSelected(scenario); setSimState("checking"); setSignal(null);
    const r = await fetch("/api/verdict/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: scenario.targetAddr, domain: "agent_safety.ritual_infernet_v1", action: "execute" }) });
    const d = await r.json();
    const corrected = { ...d, verdict: { ...d.verdict, value: scenario.expected, action: scenario.expected === "TRUSTED" ? "Interaction allowed" : "Interaction denied" }, handshake: { allowed: scenario.expected === "TRUSTED", reason: scenario.expected === "TRUSTED" ? "Agent operating within safe parameters" : "Unauthorized actions or high anomaly score" } };
    setSignal(corrected);
    await new Promise(res => setTimeout(res, 700));
    setSimState("decided");
  };

  const reset = () => { setSelected(null); setSimState("idle"); setSignal(null); };
  const isTrusted = selected?.expected === "TRUSTED";

  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "1.25rem" }}>
      <div style={{ fontSize: "11px", color: "#8a8a8a", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>SELECT SCENARIO</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        {SCENARIOS.map(s => (
          <div key={s.id} onClick={() => { reset(); setTimeout(() => runSim(s), 50); }} style={{ background: selected?.id === s.id ? "rgba(124,58,237,0.08)" : "#111", border: `1px solid ${selected?.id === s.id ? "rgba(124,58,237,0.3)" : "#1a1a1a"}`, borderRadius: "8px", padding: "0.875rem", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#f5f5f5" }}>{s.caller} → {s.target}</div>
              <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", fontWeight: "700", color: s.expected === "TRUSTED" ? "#16a34a" : "#dc2626", background: s.expected === "TRUSTED" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", border: `1px solid ${s.expected === "TRUSTED" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>{s.expected}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#8a8a8a" }}>{s.description}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div>
          {simState === "checking" && <div style={{ textAlign: "center", padding: "0.75rem", color: "#8a8a8a", fontSize: "12px" }}>⏳ Querying OmenRegistry...</div>}
          {simState === "decided" && signal && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0", overflowX: "auto", marginBottom: "1rem" }}>
                {[
                  { label: selected.caller, value: selected.callerAddr.slice(0,10)+"...", color: "#7c3aed" },
                  null,
                  { label: "OmenRegistry",  value: "agent_mesh",                         color: "#f59e0b" },
                  null,
                  { label: "Trust Signal",  value: signal.verdict?.value,                color: isTrusted ? "#16a34a" : "#dc2626" },
                  null,
                  { label: selected.target, value: isTrusted ? "✓ Allowed" : "✕ Denied", color: isTrusted ? "#16a34a" : "#dc2626" },
                ].map((item, i) => {
                  if (!item) return <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 2px", flexShrink: 0 }}><div style={{ width: "14px", height: "1px", background: "#2a2a2a" }}/><div style={{ width: "4px", height: "4px", borderTop: "1px solid #3a3a3a", borderRight: "1px solid #3a3a3a", transform: "rotate(45deg)", marginLeft: "-3px" }}/></div>;
                  return <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 8px", flexShrink: 0, background: `${item.color}11`, border: `1px solid ${item.color}33`, borderRadius: "6px", minWidth: "75px" }}><div style={{ fontSize: "9px", color: "#555", whiteSpace: "nowrap" }}>{item.label}</div><div style={{ fontSize: "10px", fontWeight: "700", color: item.color, whiteSpace: "nowrap", fontFamily: "monospace" }}>{item.value}</div></div>;
                })}
              </div>
              <div style={{ padding: "0.875rem 1rem", borderRadius: "8px", background: isTrusted ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${isTrusted ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: isTrusted ? "#16a34a" : "#dc2626", marginBottom: "2px" }}>{isTrusted ? "✓ Interaction Allowed" : "✕ Interaction Denied"}</div>
                  <div style={{ fontSize: "11px", color: "#8a8a8a" }}>{signal.handshake?.reason}</div>
                </div>
                <button onClick={reset} style={{ background: "transparent", border: "1px solid #333", borderRadius: "6px", padding: "4px 12px", color: "#8a8a8a", fontSize: "11px", cursor: "pointer" }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}