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
    <div style={{ background: "#0a0a0a", minHeight: "100vh", position: "relative" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "gridMove 25s linear infinite",
        }}/>
        <div style={{
          position: "absolute", top: "10%", left: "-15%",
          width: "600px", height: "600px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "floatLeft 14s ease-in-out infinite",
        }}/>
        <div style={{
          position: "absolute", top: "20%", right: "-15%",
          width: "600px", height: "600px",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "floatRight 16s ease-in-out infinite",
        }}/>
        <div style={{
          position: "absolute", bottom: "-5%", left: "50%",
          transform: "translateX(-50%)",
          width: "700px", height: "300px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}/>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          padding: "8rem 2rem 6rem", textAlign: "center",
        }}>
          <div className="fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "20px", padding: "5px 16px",
            fontSize: "11px", color: "#f59e0b",
            marginBottom: "2.5rem", letterSpacing: "0.08em",
          }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#f59e0b", boxShadow: "0 0 6px #f59e0b",
            }}/>
            LIVE ON RITUAL CHAIN · {health?.block ? `BLOCK ${health.block.toLocaleString()}` : "CONNECTING..."}
          </div>

          <h1 className="fade-up-delay-1" style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: "800", lineHeight: "1.05",
            color: "#f5f5f5", marginBottom: "1.75rem",
            letterSpacing: "-0.02em",
          }}>
            Verifiable Trust For{" "}<br/>
            <span style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Autonomous Coordination</span>
          </h1>

          <p className="fade-up-delay-2" style={{
            fontSize: "1.1rem", color: "#cfcfcf",
            maxWidth: "540px", margin: "0 auto 1.25rem",
            lineHeight: "1.8",
          }}>
            Built on Ritual to help autonomous systems evaluate counterparties before they act.
          </p>

          <p className="fade-up-delay-3" style={{
            fontSize: "0.95rem", color: "#b0b0b0",
            maxWidth: "500px", margin: "0 auto 3.5rem",
            lineHeight: "1.7",
          }}>
            Omen transforms onchain behavior into verifiable trust signals that agents, wallets, and autonomous systems can understand.
          </p>

          <div className="fade-up-delay-4" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/check" className="btn-primary" style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0a0a0a", padding: "13px 32px",
              borderRadius: "8px", fontWeight: "700",
              fontSize: "14px", textDecoration: "none",
              letterSpacing: "0.02em",
            }}>
              Run Trust Check →
            </Link>
            <a href="#architecture" className="btn-secondary" style={{
              background: "transparent", color: "#cfcfcf",
              padding: "13px 32px", borderRadius: "8px",
              fontWeight: "500", fontSize: "14px",
              textDecoration: "none", border: "1px solid #333",
            }}>
              Explore Architecture
            </a>
          </div>

          {/* Protocol flow visualization */}
          <div className="fade-up-delay-5" style={{
            marginTop: "4rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0", flexWrap: "nowrap", overflowX: "auto",
          }}>
            {[
              { label: "Onchain Activity", sub: "tx history · approvals",      color: "#8a8a8a", icon: "◈" },
              null,
              { label: "Evidence Object",  sub: "merkle root · features",      color: "#f59e0b", icon: "⬡" },
              null,
              { label: "LLM Evaluation",   sub: "TEE attested · Ritual",       color: "#7c3aed", icon: "◎" },
              null,
              { label: "Trust Signal",     sub: "TRUSTED · REVOKED · PENDING", color: "#16a34a", icon: "✦" },
            ].map((item, i) => {
              if (!item) return (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <div style={{
                    width: "32px", height: "1px",
                    background: "linear-gradient(90deg, #2a2a2a, #3a3a3a, #2a2a2a)",
                  }}/>
                  <div style={{
                    width: "4px", height: "4px",
                    borderTop: "1px solid #3a3a3a",
                    borderRight: "1px solid #3a3a3a",
                    transform: "rotate(45deg)",
                    marginLeft: "-3px",
                  }}/>
                </div>
              );
              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "6px",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid #1a1a1a",
                  borderRadius: "10px",
                  minWidth: "120px",
                }}>
                  <div style={{ fontSize: "16px", color: item.color }}>{item.icon}</div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#cfcfcf", whiteSpace: "nowrap" }}>{item.label}</div>
                  <div style={{ fontSize: "9px", color: "#8a8a8a", whiteSpace: "nowrap", letterSpacing: "0.03em" }}>{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 7rem" }}>
          <div className="fade-up-delay-5" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px", background: "#1a1a1a",
            border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden",
          }}>
            {[
              { label: "Current Block",   value: health?.block ? health.block.toLocaleString() : "—", accent: "#f59e0b" },
              { label: "Network",         value: "Ritual · 1979", accent: "#7c3aed" },
              { label: "Trust Domains",   value: "2 Active", accent: "#f59e0b" },
              { label: "Protocol Status", value: health?.status === "ok" ? "Online" : "—", accent: "#16a34a" },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{
                background: "#0d0d0d", padding: "2rem 1.5rem", textAlign: "center",
              }}>
                <div style={{
                  fontSize: "1.5rem", fontWeight: "700",
                  color: accent, marginBottom: "0.4rem",
                  fontFamily: "monospace", letterSpacing: "-0.02em",
                }}>{value}</div>
                <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div id="architecture" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 7rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
              PROTOCOL ARCHITECTURE
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", letterSpacing: "-0.02em" }}>
              How It Works
            </h2>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px", background: "#1a1a1a",
            borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a1a",
          }}>
            {[
              { step: "01", title: "Collect Evidence",  desc: "Omen gathers behavioral and onchain signals relevant to trust evaluation.", icon: "◈", color: "#f59e0b" },
              { step: "02", title: "Evaluate Trust",    desc: "Ritual-powered intelligence analyzes evidence and produces a verifiable trust verdict.", icon: "⬡", color: "#7c3aed" },
              { step: "03", title: "Coordinate Safely", desc: "Agents, wallets, and applications consume trust signals before taking action.", icon: "◎", color: "#16a34a" },
            ].map(({ step, title, desc, icon, color }) => (
              <div key={step} className="card-hover" style={{
                background: "#0d0d0d", padding: "2.5rem 2rem",
                position: "relative", cursor: "default",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "1.25rem", color, opacity: 0.8 }}>{icon}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#8a8a8a", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
                  STEP {step}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "600", color: "#f5f5f5", marginBottom: "0.75rem" }}>{title}</div>
                <div style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.7" }}>{desc}</div>
                <div style={{
                  position: "absolute", bottom: "1.5rem", right: "1.5rem",
                  fontSize: "11px", color, fontFamily: "monospace", opacity: 0.3,
                }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Domains */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 7rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
              EVALUATION LAYER
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", letterSpacing: "-0.02em" }}>
              Trust Domains
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {[
              { id: "counterparty_trust.ritual_trade_v1", name: "Counterparty Trust", question: "Should an autonomous system coordinate with this counterparty?", color: "#f59e0b" },
              { id: "agent_safety.ritual_infernet_v1",    name: "Agent Safety",       question: "Should this agent be allowed to operate independently?",          color: "#7c3aed" },
            ].map(({ id, name, question, color }) => (
              <div key={id} className="card-hover" style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a",
                borderRadius: "12px", padding: "2rem",
                position: "relative", overflow: "hidden", cursor: "default",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: "600", color: "#f5f5f5" }}>{name}</div>
                  <span style={{
                    fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                    background: "rgba(22,163,74,0.08)", color: "#16a34a",
                    border: "1px solid rgba(22,163,74,0.2)", fontWeight: "600",
                    letterSpacing: "0.05em",
                  }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: "11px", color: "#8a8a8a", fontFamily: "monospace", marginBottom: "1rem" }}>{id}</div>
                <div style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.7", marginBottom: "1.5rem" }}>{question}</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["TRUSTED", "PENDING", "REVOKED", "UNSEEN"].map(v => (
                    <span key={v} style={{
                      fontSize: "10px", padding: "3px 10px", borderRadius: "4px",
                      background: v === "TRUSTED" ? "rgba(22,163,74,0.08)" : v === "REVOKED" ? "rgba(220,38,38,0.08)" : v === "PENDING" ? "rgba(245,158,11,0.08)" : "rgba(102,102,102,0.08)",
                      color: v === "TRUSTED" ? "#16a34a" : v === "REVOKED" ? "#dc2626" : v === "PENDING" ? "#f59e0b" : "#8a8a8a",
                      border: `1px solid ${v === "TRUSTED" ? "rgba(22,163,74,0.2)" : v === "REVOKED" ? "rgba(220,38,38,0.2)" : v === "PENDING" ? "rgba(245,158,11,0.2)" : "rgba(102,102,102,0.2)"}`,
                      fontWeight: "600", letterSpacing: "0.05em",
                    }}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Omen */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 7rem" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(124,58,237,0.04) 100%)",
            border: "1px solid #1a1a1a", borderRadius: "16px",
            padding: "4rem 3rem", textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: "500px", height: "300px",
              background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}/>
            <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.12em", marginBottom: "1.25rem" }}>
              WHY OMEN
            </div>
            <h3 style={{
              fontSize: "1.9rem", fontWeight: "700",
              color: "#f5f5f5", marginBottom: "1.25rem",
              letterSpacing: "-0.02em", lineHeight: "1.2",
            }}>
              Intelligence decides what to do.{" "}
              <span style={{
                background: "linear-gradient(135deg, #f59e0b, #7c3aed)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Trust decides who to do it with.</span>
            </h3>
            <p style={{
              fontSize: "14px", color: "#b0b0b0", lineHeight: "1.8",
              maxWidth: "460px", margin: "0 auto 2.5rem",
            }}>
              Built for agents, applications, and autonomous systems operating on Ritual.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/builder" className="btn-primary" style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#0a0a0a", padding: "12px 28px",
                borderRadius: "8px", fontWeight: "700",
                fontSize: "14px", textDecoration: "none",
              }}>
                Build Evidence →
              </Link>
              <Link href="/agents" className="btn-secondary" style={{
                background: "transparent", color: "#cfcfcf",
                padding: "12px 28px", borderRadius: "8px",
                fontWeight: "500", fontSize: "14px",
                textDecoration: "none", border: "1px solid #333",
              }}>
                View Agents
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          padding: "0 2rem 3rem", borderTop: "1px solid #1a1a1a",
        }}>
          <div style={{
            paddingTop: "2rem", display: "flex",
            justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "1rem",
          }}>
            <div>
              <div style={{ fontSize: "13px", color: "#8a8a8a", marginBottom: "4px" }}>
                Trust Infrastructure For Autonomous Systems
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a8a" }}>Built on Ritual Chain</div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {[
                { label: "OmenJudgment", addr: health?.contracts?.judgment },
                { label: "OmenRegistry", addr: health?.contracts?.registry },
              ].map(({ label, addr }) => (
                <div key={label} style={{ fontSize: "11px", color: "#8a8a8a" }}>
                  {label}: <span style={{ color: "#b0b0b0", fontFamily: "monospace" }}>
                    {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}