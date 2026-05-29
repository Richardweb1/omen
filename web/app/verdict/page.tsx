"use client";
import { useState } from "react";

const API = '/api';

const DEMO = [
  { address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", label: "Clean Trade Subject", expected: "SEALED" },
  { address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", label: "Risky Trade Subject", expected: "REVOKED" },
  { address: "0x0000000000000000000000000000000000000b0b", label: "Agent Safety Subject", expected: "SEALED" },
];

const VSTYLE: any = {
  SEALED:  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)" },
  LAPSED:  { color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)"  },
};

export default function trust signal() {
  const [subject, setSubject] = useState("");
  const [domain, setDomain]   = useState("counterparty_trust.ritual_trade_v1");
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const lookup = async (addr?: string) => {
    const s = addr || subject;
    if (!s) return setError("Enter a wallet address");
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch(`${API}/trust signal/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, domain, action: "trade" }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
      if (addr) setSubject(addr);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const vs = result?.trust signal?.value;
  const style = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : null;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Trust Signal Explorer
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Read the latest trust signal for any wallet from OmenRegistry
        </p>
      </div>

      {/* Input */}
      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="0x... wallet address"
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
            {loading ? "..." : "Look up →"}
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
          <option value="counterparty_trust.ritual_trade_v1">Counterparty Trust — trade</option>
          <option value="agent_safety.ritual_infernet_v1">Agent Safety — execute</option>
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
          borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
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
              {result.trust signal?.value}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {[
              { label: "Action",   value: result.trust signal?.action },
              { label: "Fresh",    value: result.trust signal?.isFresh ? "Yes" : "No" },
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

          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a",
            borderRadius: "8px", padding: "0.75rem",
            fontSize: "12px", color: "#666",
          }}>
            {result.handshake?.reason}
          </div>
        </div>
      )}

      {/* Demo subjects */}
      <div>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
          DEMO SUBJECTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {DEMO.map(({ address, label, expected }) => (
            <div
              key={address}
              onClick={() => lookup(address)}
              style={{
                background: "#111", border: "1px solid #1a1a1a",
                borderRadius: "8px", padding: "0.875rem 1rem",
                cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#f5f5f5", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>{address.slice(0, 20)}...</div>
              </div>
              <span style={{
                fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                color: VSTYLE[expected]?.color,
                background: VSTYLE[expected]?.bg,
                border: `1px solid ${VSTYLE[expected]?.border}`,
                fontWeight: "600",
              }}>{expected}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
