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

const KNOWN_AGENTS = [
  {
    address: "0x3260dDe013d8c5130092B3DFB7d44DdD995da528",
    label: "OmenSovereignAgent",
    type: "Sovereign Agent",
    schedule: "2218803",
    domain: "agent_safety.ritual_infernet_v1",
    description: "Wakes every 500 blocks. Watches 2 subjects autonomously.",
  },
  {
    address: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295",
    label: "OmenAgentAware",
    type: "Agent Contract",
    schedule: null,
    domain: "agent_safety.ritual_infernet_v1",
    description: "Checks OmenRegistry before acting. Trust-aware execution.",
  },
  {
    address: "0x7040235955B2D397d7CB717a300911Ec68644aFe",
    label: "OmenAgentDirect",
    type: "Agent Contract",
    schedule: null,
    domain: "counterparty_trust.ritual_trade_v1",
    description: "Direct execution without trust check. Baseline comparison.",
  },
];

export default function Agents() {
  const [subject, setSubject]   = useState("");
  const [domain, setDomain]     = useState("agent_safety.ritual_infernet_v1");
  const [result, setResult]     = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [blockNum, setBlockNum] = useState<number | null>(null);

  // fetch current block for agent heartbeat
  useEffect(() => {
    fetch(`${API}/block`)
      .then(r => r.json())
      .then(d => setBlockNum(d.block))
      .catch(() => null);
  }, []);

  const lookup = async (addr?: string) => {
    const s = addr || subject;
    if (!s) return setError("Enter an agent or wallet address");
    setLoading(true); setError(""); setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const r = await fetch(`${API}/verdict/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, domain, action: "execute" }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
      if (addr) setSubject(addr);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const vs = result?.verdict?.value;
  const style = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : null;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Agent & Trust Monitor
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Read trust signals for any agent or wallet. All addresses use the same OmenRegistry —
          agents and wallets are evaluated identically.
        </p>
      </div>

      {/* Lookup */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem",
      }}>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "1rem", letterSpacing: "0.05em" }}>
          TRUST SIGNAL LOOKUP
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="0x... agent contract or wallet address"
            style={{
              flex: 1, background: "#0a0a0a",
              border: "1px solid #222", borderRadius: "8px",
              padding: "10px 14px", color: "#f5f5f5",
              fontSize: "14px", fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => lookup()}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0a0a0a", padding: "10px 20px",
              borderRadius: "8px", fontWeight: "600",
              fontSize: "14px", border: "none", cursor: "pointer",
            }}
          >
            {loading ? "..." : "Read Signal →"}
          </button>
        </div>
        <select
          value={domain}
          onChange={e => setDomain(e.target.value)}
          style={{
            width: "100%", background: "#0a0a0a",
            border: "1px solid #222", borderRadius: "8px",
            padding: "10px 14px", color: "#f5f5f5",
            fontSize: "13px", outline: "none",
          }}
        >
          <option value="agent_safety.ritual_infernet_v1">Agent Safety — execute</option>
          <option value="counterparty_trust.ritual_trade_v1">Counterparty Trust — trade</option>
          <option value="agent_mesh.ritual_infernet_v1">Agent Mesh — agent-to-agent</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#dc2626", fontSize: "13px", marginBottom: "1rem",
        }}>{error}</div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: "#111", border: `1px solid ${style?.border}`,
          borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "4px" }}>
                {result.subject}
              </div>
              <div style={{ fontSize: "11px", color: "#444" }}>{result.domain}</div>
            </div>
            <div style={{
              padding: "6px 16px", borderRadius: "6px",
              fontSize: "14px", fontWeight: "700",
              color: style?.color, background: style?.bg,
              border: `1px solid ${style?.border}`,
            }}>
              {result.verdict?.value}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Action",    value: result.verdict?.action },
              { label: "Fresh",     value: result.verdict?.isFresh ? "Yes" : "No" },
              { label: "Handshake", value: result.handshake?.allowed ? "ALLOWED" : "DENIED" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#0a0a0a", border: "1px solid #1a1a1a",
                borderRadius: "8px", padding: "0.75rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Known Agents */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "1rem", letterSpacing: "0.05em" }}>
          OMEN AGENTS ON RITUAL CHAIN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {KNOWN_AGENTS.map(agent => (
            <div key={agent.address} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "12px", padding: "1.5rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#f5f5f5", marginBottom: "4px" }}>
                    {agent.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
                    {agent.address}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{
                    fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                    background: "rgba(124,58,237,0.1)", color: "#7c3aed",
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}>{agent.type}</span>
                  {agent.schedule && (
                    <span style={{
                      fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                      background: "rgba(22,163,74,0.1)", color: "#16a34a",
                      border: "1px solid rgba(22,163,74,0.2)",
                    }}>Schedule #{agent.schedule}</span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: "13px", color: "#666", marginBottom: "1rem" }}>
                {agent.description}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
                  {agent.domain}
                </div>
                <button
                  onClick={() => { setDomain(agent.domain); lookup(agent.address); }}
                  style={{
                    background: "transparent", border: "1px solid #2a2a2a",
                    borderRadius: "6px", padding: "4px 12px",
                    color: "#999", fontSize: "12px", cursor: "pointer",
                  }}
                >
                  Check trust →
                </button>
              </div>

              {/* Sovereign agent heartbeat */}
              {agent.schedule && blockNum && (
                <div style={{
                  marginTop: "1rem", padding: "0.75rem",
                  background: "#0a0a0a", border: "1px solid #1a1a1a",
                  borderRadius: "8px",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>CURRENT BLOCK</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5", fontFamily: "monospace" }}>
                      {blockNum.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>WAKE INTERVAL</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>500 blocks</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>NEXT WAKE</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a", fontFamily: "monospace" }}>
                      ~{blockNum + (500 - (blockNum % 500))}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>STATUS</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#16a34a", boxShadow: "0 0 6px #16a34a",
                      }}/>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a" }}>LIVE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent-to-agent info */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem",
      }}>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
          AGENT-TO-AGENT VERIFICATION
        </div>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.7", marginBottom: "1rem" }}>
          Any agent on Ritual can verify another agent before calling it.
          OmenRegistry accepts any address — wallets and agent contracts
          are evaluated identically. Use domain <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>agent_mesh.ritual_infernet_v1</span> for
          agent-to-agent trust checks.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {[
            { label: "01", title: "Agent registers", desc: "Any contract address can be a subject in OmenRegistry" },
            { label: "02", title: "Evidence builds", desc: "Onchain behavior generates reproducible SignalObjects" },
            { label: "03", title: "Agent checks agent", desc: "Call isTrusted(address) before any cross-agent interaction" },
          ].map(({ label, title, desc }) => (
            <div key={label} style={{
              background: "#0a0a0a", border: "1px solid #1a1a1a",
              borderRadius: "8px", padding: "1rem",
            }}>
              <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontFamily: "monospace" }}>{label}</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5", marginBottom: "4px" }}>{title}</div>
              <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}