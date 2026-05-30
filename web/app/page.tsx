"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = '/api';

export default function Home() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "4rem 2rem" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "5rem" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "20px", padding: "4px 14px",
          fontSize: "12px", color: "#f59e0b",
          marginBottom: "1.5rem", letterSpacing: "0.05em",
        }}>
          LIVE ON RITUAL CHAIN · {health?.block ? `BLOCK ${health.block.toLocaleString()}` : "CONNECTING..."}
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: "700", lineHeight: "1.1",
          color: "#f5f5f5", marginBottom: "1.5rem",
        }}>
          Know who to trust{" "}
          <span style={{
            background: "linear-gradient(135deg, #f59e0b, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
             before you interact.</span>
        </h1>

        <p style={{
          fontSize: "1.1rem", color: "#888",
          maxWidth: "600px", margin: "0 auto 2.5rem",
          lineHeight: "1.7",
        }}>
          Paste any wallet address. Omen checks its onchain history and tells you if it is safe to interact with — powered by AI running inside Ritual chain.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/builder" style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0a", padding: "12px 28px",
            borderRadius: "8px", fontWeight: "600",
            fontSize: "14px", textDecoration: "none",
            transition: "opacity 0.15s",
          }}>
            Build Evidence →
          </Link>
          <Link href="/demo" style={{
            background: "transparent",
            color: "#f5f5f5", padding: "12px 28px",
            borderRadius: "8px", fontWeight: "500",
            fontSize: "14px", textDecoration: "none",
            border: "1px solid #333",
          }}>
            View Demo Lab
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem", marginBottom: "5rem",
      }}>
        {[
          { label: "Current Block",  value: health?.block ? health.block.toLocaleString() : "—" },
          { label: "Network",        value: "Ritual · 1979" },
          { label: "Domains Live",   value: "2" },
          { label: "Status",         value: health?.status === "ok" ? "Online" : "—", green: true },
        ].map(({ label, value, green }) => (
          <div key={label} style={{
            background: "#111", border: "1px solid #1a1a1a",
            borderRadius: "10px", padding: "1.25rem",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "1.4rem", fontWeight: "700",
              color: green ? "#16a34a" : "#f59e0b",
              marginBottom: "0.25rem",
            }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: "5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "2rem", textAlign: "center" }}>
          How It Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {[
            { step: "01", title: "Build Signal", desc: "Reproducible evidence artifacts from onchain activity. Merkle root + feature extraction." },
            { step: "02", title: "Form Verdict", desc: "Ritual's AI layer evaluates evidence and returns an attested verdict — proof of which model ran." },
            { step: "03", title: "Consume Trust", desc: "OmenRegistry exposes compact verdict state. Agents and contracts react in one cheap call." },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "12px", padding: "1.75rem",
            }}>
              <div style={{
                fontSize: "11px", fontWeight: "700",
                color: "#7c3aed", letterSpacing: "0.1em",
                marginBottom: "0.75rem",
              }}>STEP {step}</div>
              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "0.5rem" }}>{title}</div>
              <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Domains */}
      <div style={{ marginBottom: "5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "2rem", textAlign: "center" }}>
          Live Domains
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          {[
            {
              id: "counterparty_trust.ritual_trade_v1",
              name: "Counterparty Trust",
              question: "Should this wallet be trusted as a trading counterparty?",
              action: "trade",
            },
            {
              id: "agent_safety.ritual_infernet_v1",
              name: "Agent Safety",
              question: "Should this Ritual agent be permitted to act autonomously?",
              action: "execute",
            },
          ].map(({ id, name, question, action }) => (
            <div key={id} style={{
              background: "#111", border: "1px solid #1a1a1a",
              borderRadius: "12px", padding: "1.75rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1rem", fontWeight: "600", color: "#f5f5f5" }}>{name}</div>
                <span style={{
                  fontSize: "10px", padding: "2px 8px",
                  borderRadius: "4px", background: "rgba(22,163,74,0.1)",
                  color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)",
                  fontWeight: "500",
                }}>ACTIVE</span>
              </div>
              <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "0.75rem" }}>{id}</div>
              <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.5", marginBottom: "1rem" }}>{question}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["SEALED", "PENDING", "REVOKED", "UNSEEN"].map(v => (
                  <span key={v} style={{
                    fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                    background: v === "SEALED" ? "rgba(22,163,74,0.1)" : v === "REVOKED" ? "rgba(220,38,38,0.1)" : v === "PENDING" ? "rgba(245,158,11,0.1)" : "rgba(102,102,102,0.1)",
                    color: v === "SEALED" ? "#16a34a" : v === "REVOKED" ? "#dc2626" : v === "PENDING" ? "#f59e0b" : "#666",
                    border: `1px solid ${v === "SEALED" ? "rgba(22,163,74,0.2)" : v === "REVOKED" ? "rgba(220,38,38,0.2)" : v === "PENDING" ? "rgba(245,158,11,0.2)" : "rgba(102,102,102,0.2)"}`,
                  }}>{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #1a1a1a", paddingTop: "2rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <div style={{ fontSize: "13px", color: "#444" }}>
          Omen Protocol · Built on Ritual Chain
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "OmenJudgment", addr: health?.contracts?.judgment },
            { label: "OmenRegistry", addr: health?.contracts?.registry },
          ].map(({ label, addr }) => (
            <div key={label} style={{ fontSize: "11px", color: "#444" }}>
              {label}: <span style={{ color: "#555", fontFamily: "monospace" }}>
                {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
