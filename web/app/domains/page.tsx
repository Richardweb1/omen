"use client";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";

const VSTYLE: any = {
  SEALED:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
};

const CONSUMPTION = [
  { verdict: "SEALED",  action: "Allow when fresh",           color: "#16a34a" },
  { verdict: "REVOKED", action: "Deny the interaction",        color: "#dc2626" },
  { verdict: "PENDING", action: "Review or tighten policy",    color: "#f59e0b" },
  { verdict: "UNSEEN",  action: "Collect signal first",        color: "#666666" },
  { verdict: "LAPSED",  action: "Refresh before acting",       color: "#7c3aed" },
];

export default function Domains() {
  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/domains`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(d => setDomains(d.domains || []))
      .catch((e) => console.error("domains error:", e));
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Domain Explorer
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Each domain answers a specific trust question with its own evaluation policy and outcomes
        </p>
      </div>

      {/* What is a domain */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "0.75rem" }}>
          What is a Domain?
        </h2>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.7", marginBottom: "1rem" }}>
          An <span style={{ color: "#f59e0b" }}>OmenSpec</span> defines the semantic boundary for judgment. Each domain answers a specific trust question with its own evidence policy, evaluation rules, and consumption model.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {["OmenSpec", "SignalObject", "ReadingArtifact", "VerdictObject"].map(obj => (
            <div key={obj} style={{
              background: "#0a0a0a", border: "1px solid #222",
              borderRadius: "8px", padding: "0.75rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#7c3aed" }}>{obj}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live domains */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "1rem", letterSpacing: "0.05em" }}>
          LIVE DOMAINS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {domains.map(domain => (
            <div key={domain.id} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "12px", padding: "1.5rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "4px" }}>
                    {domain.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>{domain.id}</div>
                </div>
                <span style={{
                  fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                  background: "rgba(22,163,74,0.1)", color: "#16a34a",
                  border: "1px solid rgba(22,163,74,0.2)", fontWeight: "500",
                }}>ACTIVE</span>
              </div>

              <div style={{ fontSize: "13px", color: "#777", marginBottom: "1rem", lineHeight: "1.5" }}>
                {domain.question}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.5rem" }}>REQUIRED FEATURES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {domain.features?.map((f: string) => (
                      <div key={f} style={{
                        fontSize: "12px", color: "#666",
                        fontFamily: "monospace", padding: "2px 0",
                        borderLeft: "2px solid #222", paddingLeft: "8px",
                      }}>{f}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.5rem" }}>POSSIBLE OUTCOMES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {domain.outcomes?.map((o: string) => (
                      <span key={o} style={{
                        fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                        color: VSTYLE[o]?.color || "#666",
                        background: VSTYLE[o]?.bg || "rgba(102,102,102,0.1)",
                        border: `1px solid ${VSTYLE[o]?.border || "rgba(102,102,102,0.3)"}`,
                        fontWeight: "500",
                      }}>{o}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.35rem" }}>NETWORK</div>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                      background: "rgba(124,58,237,0.1)", color: "#7c3aed",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}>{domain.network}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consumption rules */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem",
      }}>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "1rem", letterSpacing: "0.05em" }}>
          HOT-PATH CONSUMPTION RULES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {CONSUMPTION.map(({ verdict, action, color }) => (
            <div key={verdict} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "0.75rem", background: "#0a0a0a",
              borderRadius: "8px", border: "1px solid #1a1a1a",
            }}>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "2px 10px",
                borderRadius: "4px", color, minWidth: "80px", textAlign: "center",
                background: `${color}18`, border: `1px solid ${color}44`,
              }}>{verdict}</span>
              <span style={{ fontSize: "13px", color: "#666" }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}