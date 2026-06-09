"use client";

const STEPS = [
  {
    num: "01",
    title: "Evidence Values",
    desc: "A wallet enters bounded evidence values such as transaction count, failure rate, approvals, or anomaly score.",
    color: "#8a8a8a",
    icon: "◈",
  },
  {
    num: "02",
    title: "SignalObject",
    desc: "Evidence is structured into a signal object with an evidence hash stored alongside the submitted block window.",
    color: "#f59e0b",
    icon: "⬡",
  },
  {
    num: "03",
    title: "Trust Signal",
    desc: "Omen evaluates the evidence against domain policy and produces a bounded signal: TRUSTED, REVOKED, or PENDING.",
    color: "#7c3aed",
    icon: "◎",
  },
  {
    num: "04",
    title: "OmenRegistry",
    desc: "The trust signal is stored onchain and exposed as a compact mirror. Any agent can read it in a single call.",
    color: "#f59e0b",
    icon: "▣",
  },
  {
    num: "05",
    title: "Agent Decision",
    desc: "OmenAgentAware queries OmenRegistry before acting. The trust signal determines what happens next.",
    color: "#7c3aed",
    icon: "⬡",
  },
  {
    num: "06",
    title: "Execution",
    desc: "TRUSTED allows execution. REVOKED denies execution. The decision comes from an onchain registry record.",
    color: "#16a34a",
    icon: "✦",
  },
];

const CONTRACTS = [
  {
    name: "OmenJudgment",
    addr: "0xc32a1e26e77664753b4A54a4312dF0a8159147D0",
    role: "Stores evidence and trust signal history. Every re-evaluation adds to the permanent record.",
    color: "#f59e0b",
  },
  {
    name: "OmenRegistry",
    addr: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620",
    role: "Fast onchain read layer. One call returns the trust signal, freshness, and handshake decision.",
    color: "#7c3aed",
  },
  {
    name: "OmenAgentAware",
    addr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295",
    role: "Agent-aware contract support that queries OmenRegistry before an action.",
    color: "#16a34a",
  },
  {
    name: "OmenSovereignAgent",
    addr: "0x3260dDe013d8c5130092B3DFB7d44DdD995da528",
    role: "Experimental scheduler-capable agent contract. Not part of the primary Home UX.",
    color: "#8a8a8a",
  },
];

export default function Architecture() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          PROTOCOL ARCHITECTURE
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
          How Omen Works
        </h1>
        <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.7", maxWidth: "600px" }}>
          Omen stores wallet-signed evidence values and mirrors bounded trust states to OmenRegistry. Agents can read the registry before acting.
        </p>
      </div>

      {/* Visual pipeline */}
      <div style={{
        background: "#0d0d0d", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem",
        overflowX: "auto",
      }}>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
          FULL FLOW
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0", minWidth: "600px" }}>
          {[
            { label: "Evidence Values", color: "#8a8a8a" },
            null,
            { label: "SignalObject",     color: "#f59e0b" },
            null,
            { label: "Trust Signal",     color: "#7c3aed" },
            null,
            { label: "OmenRegistry",     color: "#f59e0b" },
            null,
            { label: "Agent Decision",   color: "#7c3aed" },
            null,
            { label: "Execution",        color: "#16a34a" },
          ].map((item, i) => {
            if (!item) return (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: "24px", height: "1px", background: "#2a2a2a" }}/>
                <div style={{
                  width: "5px", height: "5px",
                  borderTop: "1px solid #3a3a3a", borderRight: "1px solid #3a3a3a",
                  transform: "rotate(45deg)", marginLeft: "-3px",
                }}/>
              </div>
            );
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                padding: "10px 14px", flexShrink: 0,
                background: `${item.color}11`,
                border: `1px solid ${item.color}33`,
                borderRadius: "8px", minWidth: "100px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: item.color, whiteSpace: "nowrap", textAlign: "center" }}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "3rem" }}>
        {STEPS.map(({ num, title, desc, color, icon }) => (
          <div key={num} style={{
            background: "#111", border: "1px solid #1a1a1a",
            borderRadius: "12px", padding: "1.5rem",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "2px",
              background: `linear-gradient(90deg, ${color}, transparent)`,
            }}/>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{
                fontSize: "18px", color, opacity: 0.8, flexShrink: 0, marginTop: "2px",
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: "10px", color: "#555", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  STEP {num}
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#f5f5f5", marginBottom: "6px" }}>
                  {title}
                </div>
                <div style={{ fontSize: "12px", color: "#b0b0b0", lineHeight: "1.6" }}>
                  {desc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust signal outcomes */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
          TRUST SIGNAL OUTCOMES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          <div style={{
            background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)",
            borderRadius: "10px", padding: "1.25rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#16a34a", marginBottom: "4px" }}>
              TRUSTED → Execute ✓
            </div>
            <div style={{ fontSize: "12px", color: "#8a8a8a" }}>
              Agent proceeds with the action
            </div>
          </div>
          <div style={{
            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: "10px", padding: "1.25rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#dc2626", marginBottom: "4px" }}>
              REVOKED → Deny ✕
            </div>
            <div style={{ fontSize: "12px", color: "#8a8a8a" }}>
              Agent rejects the action
            </div>
          </div>
        </div>
      </div>

      {/* Contract map */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
          CONTRACT MAP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {CONTRACTS.map(({ name, addr, role, color }) => (
            <div key={name} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "10px", padding: "1rem 1.25rem",
              display: "flex", alignItems: "flex-start", gap: "1rem",
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: color, flexShrink: 0, marginTop: "5px",
                boxShadow: `0 0 6px ${color}`,
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{name}</div>
                  <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>
                    {addr.slice(0, 10)}...{addr.slice(-6)}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#8a8a8a", lineHeight: "1.5" }}>{role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ritual integration */}
      <div style={{
        background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)",
        borderRadius: "10px", padding: "1.25rem",
      }}>
        <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          RITUAL CONTRACT SUPPORT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Ritual Testnet", desc: "Active Home flow uses Ritual chain 1979 and the Ritual explorer." },
            { label: "OmenRegistry", desc: "Registry-backed trust reads provide state, freshness, and handshake decisions." },
            { label: "OmenAgentAware", desc: "Contract support exists for checking OmenRegistry before an agent action." },
            { label: "Experimental Contracts", desc: "Scheduler and LLM-related contracts exist, but they are not part of the active product flow." },
          ].map(({ label, desc }) => (
            <div key={label} style={{
              display: "flex", gap: "0.75rem", alignItems: "flex-start",
              padding: "0.5rem 0", borderBottom: "1px solid #111",
            }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#7c3aed", minWidth: "220px", flexShrink: 0 }}>{label}</div>
              <div style={{ fontSize: "12px", color: "#8a8a8a" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
