"use client";
import { useState } from "react";
import { useAccount } from "wagmi";

const API = '/api';

export default function Audit() {
  const { address } = useAccount();
  const [subject, setSubject] = useState("");
  const [domain, setDomain]   = useState("counterparty_trust.ritual_trade_v1");
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState<any>(null);
  const [error, setError]     = useState("");

  const requestAudit = async () => {
    if (!subject) return setError("Enter a wallet address");
    setLoading(true); setError(""); setReport(null);
    try {
      const r = await fetch(`${API}/audit/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, domain, requester: address }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setReport(d);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: "6px", padding: "4px 12px", marginBottom: "1rem",
        }}>
          <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>PHASE 4</span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Deep Wallet Audit
        </h1>
        <p style={{ color: "#666", fontSize: "14px" }}>
          AI-powered security analysis using GLM-4.7-FP8 running inside a Ritual TEE.
        </p>
      </div>

      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
            WALLET TO AUDIT
          </label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
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
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
            DOMAIN
          </label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            style={{
              width: "100%", background: "#0a0a0a",
              border: "1px solid #222", borderRadius: "8px",
              padding: "10px 14px", color: "#f5f5f5",
              fontSize: "13px", outline: "none", boxSizing: "border-box",
            }}
          >
            <option value="counterparty_trust.ritual_trade_v1">Counterparty Trust</option>
            <option value="agent_safety.ritual_infernet_v1">Agent Safety</option>
          </select>
        </div>

        <button
          onClick={requestAudit}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed, #4c1d95)",
            border: "none", borderRadius: "8px", padding: "12px",
            color: loading ? "#555" : "#f5f5f5", fontSize: "14px",
            fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Running AI Audit in Ritual TEE..." : "Request Deep Audit"}
        </button>
      </div>

      {error && (
        <div style={{
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#dc2626", fontSize: "13px", marginBottom: "1rem",
        }}>{error}</div>
      )}

      {report && (
        <div style={{
          background: "#111", border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: "12px", padding: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#7c3aed", boxShadow: "0 0 8px #7c3aed",
            }}/>
            <span style={{ fontSize: "13px", color: "#7c3aed", fontWeight: "600" }}>
              AI AUDIT REPORT
            </span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>SUBJECT</div>
            <div style={{ fontSize: "13px", color: "#f5f5f5", fontFamily: "monospace" }}>{report.subject}</div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>TRUST SIGNAL</div>
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: "6px",
              fontSize: "13px", fontWeight: "700",
              background: report.signal === "SEALED" ? "rgba(22,163,74,0.1)" : report.signal === "REVOKED" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)",
              color: report.signal === "SEALED" ? "#16a34a" : report.signal === "REVOKED" ? "#dc2626" : "#f59e0b",
              border: "1px solid " + (report.signal === "SEALED" ? "rgba(22,163,74,0.3)" : report.signal === "REVOKED" ? "rgba(220,38,38,0.3)" : "rgba(245,158,11,0.3)"),
            }}>
              {report.signal}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>FULL REPORT</div>
            <div style={{
              background: "#0a0a0a", border: "1px solid #222",
              borderRadius: "8px", padding: "1rem",
              fontSize: "13px", color: "#999", lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            }}>
              {report.report}
            </div>
          </div>

          {report.txHash && (
  
             <a href={"https://explorer.ritualfoundation.org/tx/" + String(report.txHash)}
                target="_blank"
                 style={{ fontSize: "12px", color: "#7c3aed" }}
         >
                 View TEE attestation on Ritual explorer
              </a>
          )}
        </div>
      )}
    </div>
  );
}