"use client";
import { useState } from "react";

const API = '/api';

const DEMO = [
  { address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", label: "Clean Trade Subject" },
  { address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", label: "Active Trade Subject" },
  { address: "0x0000000000000000000000000000000000000b0b", label: "Agent Safety Subject" },
];

export default function Proofs() {
  const [subject, setSubject] = useState("");
  const [domain, setDomain]   = useState("counterparty_trust.ritual_trade_v1");
  const [proof, setProof]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const buildProof = async (addr?: string) => {
    const s = addr || subject;
    if (!s) return setError("Enter a wallet address");
    setLoading(true); setError(""); setProof(null);
    try {
      const r = await fetch(`${API}/signal/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, domain }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setProof(d);
      if (addr) setSubject(addr);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Proof Bundles
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Inspect the raw SignalObject — Merkle root, evidence features, and block window
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
            onClick={() => buildProof()}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0a0a0a", padding: "10px 20px",
              borderRadius: "8px", fontWeight: "600",
              fontSize: "14px", border: "none", cursor: "pointer",
            }}
          >
            {loading ? "..." : "Build Proof →"}
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

      {error && (
        <div style={{
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#dc2626", fontSize: "13px", marginBottom: "1rem",
        }}>{error}</div>
      )}

      {/* Proof bundle */}
      {proof && (
        <div style={{
          background: "#111", border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#f5f5f5" }}>SignalObject</div>
              <div style={{ fontSize: "11px", color: "#444" }}>{proof.version}</div>
            </div>
            <span style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
              background: "rgba(124,58,237,0.1)", color: "#7c3aed",
              border: "1px solid rgba(124,58,237,0.2)",
            }}>PROOF BUNDLE</span>
          </div>

          {/* Merkle root */}
          <div style={{
            background: "#0a0a0a", border: "1px solid #222",
            borderRadius: "8px", padding: "1rem", marginBottom: "1rem",
          }}>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px" }}>MERKLE ROOT</div>
            <div style={{ fontSize: "12px", color: "#7c3aed", fontFamily: "monospace", wordBreak: "break-all" }}>
              {proof.merkleRoot}
            </div>
          </div>

          {/* Block window */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem", marginBottom: "1rem",
          }}>
            {[
              { label: "Network",     value: proof.blockWindow?.network },
              { label: "Start Block", value: proof.blockWindow?.startBlock?.toLocaleString() },
              { label: "End Block",   value: proof.blockWindow?.endBlock?.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#0a0a0a", border: "1px solid #1a1a1a",
                borderRadius: "8px", padding: "0.75rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "10px", color: "#444", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.5rem" }}>EVIDENCE FEATURES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
              {Object.entries(proof.evidence?.featureMap || {}).map(([k, v]) => (
                <div key={k} style={{
                  background: "#0a0a0a", border: "1px solid #1a1a1a",
                  borderRadius: "6px", padding: "0.5rem 0.75rem",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "12px", color: "#555", fontFamily: "monospace" }}>{k}</span>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#f5f5f5" }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reading artifact */}
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a",
            borderRadius: "8px", padding: "1rem",
          }}>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "0.5rem" }}>READING ARTIFACT</div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span style={{
                fontSize: "13px", fontWeight: "700",
                color: proof.readingArtifact?.Trust Signal === "SEALED" ? "#16a34a" :
                       proof.readingArtifact?.Trust Signal === "REVOKED" ? "#dc2626" : "#f59e0b",
              }}>{proof.readingArtifact?.Trust Signal}</span>
              <span style={{ fontSize: "12px", color: "#555" }}>{proof.readingArtifact?.reasoning}</span>
            </div>
          </div>
        </div>
      )}

      {/* Demo subjects */}
      <div>
        <div style={{ fontSize: "12px", color: "#555", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
          DEMO SUBJECTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {DEMO.map(({ address, label }) => (
            <div
              key={address}
              onClick={() => buildProof(address)}
              style={{
                background: "#111", border: "1px solid #1a1a1a",
                borderRadius: "8px", padding: "0.875rem 1rem",
                cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#f5f5f5", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>{address.slice(0, 24)}...</div>
              </div>
              <span style={{ fontSize: "12px", color: "#7c3aed" }}>Build proof →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
