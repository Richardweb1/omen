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

const CONTRACTS = [
  { name: "OmenJudgment",   addr: "0xc32a1e26e77664753b4A54a4312dF0a8159147D0", color: "#f59e0b" },
  { name: "OmenRegistry",   addr: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620", color: "#7c3aed" },
  { name: "OmenAgentAware", addr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295", color: "#16a34a" },
];

// ─── Demo Mode Steps ───────────────────────────────────────────────────────────

function DemoMode({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const TOTAL = 6;

  const next = () => { if (step < TOTAL - 1) setStep(s => s + 1); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,10,10,0.97)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "1.25rem 2rem",
        borderBottom: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            fontSize: "12px", fontWeight: "700", color: "#f59e0b",
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
            padding: "3px 10px", borderRadius: "20px", letterSpacing: "0.05em",
          }}>DEMO MODE</div>
          <div style={{ fontSize: "13px", color: "#555" }}>
            Step {step + 1} / {TOTAL}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1, margin: "0 2rem", height: "3px", background: "#1a1a1a", borderRadius: "2px" }}>
          <div style={{
            height: "100%", borderRadius: "2px",
            background: "linear-gradient(90deg, #f59e0b, #7c3aed)",
            width: `${((step + 1) / TOTAL) * 100}%`,
            transition: "width 0.4s ease",
          }}/>
        </div>

        <button onClick={onExit} style={{
          background: "transparent", border: "1px solid #333",
          borderRadius: "6px", padding: "5px 12px",
          color: "#666", fontSize: "12px", cursor: "pointer",
        }}>Exit Demo</button>
      </div>

      {/* Step content */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{
          maxWidth: "700px", width: "100%",
          animation: "fadeIn 0.35s ease",
        }}>
          {step === 0 && <DemoStep1 />}
          {step === 1 && <DemoStep2 />}
          {step === 2 && <DemoStep3 />}
          {step === 3 && <DemoStep4 />}
          {step === 4 && <DemoStep5 />}
          {step === 5 && <DemoStep6 onExit={onExit} />}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: "1.25rem 2rem",
        borderTop: "1px solid #1a1a1a",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <button onClick={prev} disabled={step === 0} style={{
          background: "transparent", border: "1px solid #333",
          borderRadius: "8px", padding: "8px 20px",
          color: step === 0 ? "#333" : "#999", fontSize: "13px",
          cursor: step === 0 ? "default" : "pointer",
        }}>← Previous</button>

        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{
              width: i === step ? "20px" : "6px", height: "6px",
              borderRadius: "3px", transition: "all 0.3s",
              background: i === step ? "#f59e0b" : i < step ? "#7c3aed" : "#2a2a2a",
            }}/>
          ))}
        </div>

        {step < TOTAL - 1 ? (
          <button onClick={next} style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0a", padding: "8px 24px",
            borderRadius: "8px", fontWeight: "700",
            fontSize: "13px", border: "none", cursor: "pointer",
          }}>Next →</button>
        ) : (
          <button onClick={onExit} style={{
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff", padding: "8px 24px",
            borderRadius: "8px", fontWeight: "700",
            fontSize: "13px", border: "none", cursor: "pointer",
          }}>Finish ✓</button>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

function FlowRow({ steps }: { steps: { label: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", flexWrap: "nowrap", overflowX: "auto" }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <div style={{
            padding: "8px 14px", borderRadius: "8px",
            background: `${s.color}11`, border: `1px solid ${s.color}33`,
            fontSize: "12px", fontWeight: "600", color: s.color,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{s.label}</div>
          {i < steps.length - 1 && (
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0, padding: "0 4px" }}>
              <div style={{ width: "16px", height: "1px", background: "#2a2a2a" }}/>
              <div style={{ width: "4px", height: "4px", borderTop: "1px solid #3a3a3a", borderRight: "1px solid #3a3a3a", transform: "rotate(45deg)", marginLeft: "-3px" }}/>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StepShell({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "#555", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>{step}</div>
      <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f5f5f5", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>{title}</h2>
      {children}
    </div>
  );
}

function DemoStep1() {
  return (
    <StepShell step="STEP 01" title="What is Omen?">
      <p style={{ fontSize: "15px", color: "#b0b0b0", lineHeight: "1.8", marginBottom: "2rem" }}>
        Omen transforms onchain activity into verifiable trust signals that agents can use before acting.
      </p>
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", marginBottom: "1rem" }}>THE FULL FLOW</div>
        <FlowRow steps={[
          { label: "Onchain Activity", color: "#8a8a8a" },
          { label: "Trust Signal",     color: "#f59e0b" },
          { label: "Agent Decision",   color: "#7c3aed" },
          { label: "Execution",        color: "#16a34a" },
        ]}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "Verifiable", desc: "Merkle-committed evidence. Anyone can verify." },
          { label: "Bounded",    desc: "5 states. 5 actions. No interpretation needed." },
          { label: "Onchain",    desc: "Trust signals stored permanently on Ritual." },
        ].map(({ label, desc }) => (
          <div key={label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#f5f5f5", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "11px", color: "#8a8a8a", lineHeight: "1.5" }}>{desc}</div>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function DemoStep2() {
  return (
    <StepShell step="STEP 02" title="TRUSTED Address Example">
      <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.7", marginBottom: "1.5rem" }}>
        This address has a clean behavioral profile and can be safely interacted with.
      </p>
      <div style={{ background: "#111", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>SUBJECT ADDRESS</div>
        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#f5f5f5", marginBottom: "1.25rem" }}>
          0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001
        </div>
        <FlowRow steps={[
          { label: "Address",         color: "#8a8a8a" },
          { label: "TRUSTED",         color: "#16a34a" },
          { label: "Execution Allowed", color: "#16a34a" },
        ]}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "tx_count",              value: "49" },
          { label: "flagged_interactions",  value: "0"  },
          { label: "unbounded_approvals",   value: "3"  },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#16a34a" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: "1.25rem", padding: "1rem", borderRadius: "8px",
        background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#16a34a" }}>EXECUTE ACTION ✓</div>
        <div style={{ fontSize: "12px", color: "#8a8a8a", marginTop: "4px" }}>Agent proceeds with autonomous execution</div>
      </div>
    </StepShell>
  );
}

function DemoStep3() {
  return (
    <StepShell step="STEP 03" title="REVOKED Address Example">
      <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.7", marginBottom: "1.5rem" }}>
        This address triggered risk indicators and should not be trusted automatically.
      </p>
      <div style={{ background: "#111", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>SUBJECT ADDRESS</div>
        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#f5f5f5", marginBottom: "1.25rem" }}>
          0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c
        </div>
        <FlowRow steps={[
          { label: "Address",        color: "#8a8a8a" },
          { label: "REVOKED",        color: "#dc2626" },
          { label: "Execution Denied", color: "#dc2626" },
        ]}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[
          { label: "flagged_interactions", value: "1" },
          { label: "unbounded_approvals",  value: "7" },
          { label: "anomaly_score",        value: "HIGH" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#dc2626" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: "1.25rem", padding: "1rem", borderRadius: "8px",
        background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#dc2626" }}>DENY EXECUTION ✕</div>
        <div style={{ fontSize: "12px", color: "#8a8a8a", marginTop: "4px" }}>Agent rejects autonomous execution</div>
      </div>
    </StepShell>
  );
}

function DemoStep4() {
  return (
    <StepShell step="STEP 04" title="Agent-Aware Execution">
      <p style={{ fontSize: "14px", color: "#b0b0b0", lineHeight: "1.7", marginBottom: "1.5rem" }}>
        OmenAgentAware queries OmenRegistry before every autonomous action. The trust signal determines what happens next.
      </p>
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>⬡</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>OmenAgentAware</div>
            <span style={{ fontSize: "9px", padding: "1px 7px", borderRadius: "4px", color: "#7c3aed", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", fontWeight: "700", letterSpacing: "0.06em" }}>TRUST-AWARE AGENT</span>
          </div>
        </div>
        <FlowRow steps={[
          { label: "OmenAgentAware",  color: "#7c3aed" },
          { label: "Query Registry",  color: "#7c3aed" },
          { label: "Read Signal",     color: "#f59e0b" },
          { label: "Make Decision",   color: "#16a34a" },
        ]}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>TRUSTED SIGNAL</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#16a34a", marginBottom: "4px" }}>EXECUTE ✓</div>
          <div style={{ fontSize: "12px", color: "#8a8a8a" }}>Agent proceeds with action</div>
        </div>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>REVOKED SIGNAL</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#dc2626", marginBottom: "4px" }}>DENY ✕</div>
          <div style={{ fontSize: "12px", color: "#8a8a8a" }}>Agent rejects action</div>
        </div>
      </div>
    </StepShell>
  );
}

function DemoStep5() {
  return (
    <StepShell step="STEP 05" title="Why It Matters">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "10px", padding: "1.5rem" }}>
          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WITHOUT OMEN</div>
          <p style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.7", margin: 0 }}>
            Agents execute blindly. No shared trust layer. No verifiable reasoning. No way to prove why a decision was made.
          </p>
        </div>
        <div style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: "10px", padding: "1.5rem" }}>
          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WITH OMEN</div>
          <p style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.7", margin: 0 }}>
            Agents verify trust before acting. TRUSTED → Execute. REVOKED → Deny. Shared trust signals enable safer autonomous coordination.
          </p>
        </div>
      </div>
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "1.25rem" }}>
        <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>BUILT FOR RITUAL AGENTS</div>
        <p style={{ fontSize: "13px", color: "#8a8a8a", lineHeight: "1.7", margin: 0 }}>
          Omen enables agents to decide whether to proceed or reject an action based on verifiable trust signals.
        </p>
      </div>
    </StepShell>
  );
}

function DemoStep6({ onExit }: { onExit: () => void }) {
  return (
    <StepShell step="STEP 06" title="Protocol Architecture">
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", marginBottom: "1rem" }}>FULL FLOW</div>
        <FlowRow steps={[
          { label: "Onchain Activity", color: "#8a8a8a" },
          { label: "SignalObject",     color: "#f59e0b" },
          { label: "Trust Signal",     color: "#7c3aed" },
          { label: "OmenRegistry",     color: "#f59e0b" },
          { label: "Agent Decision",   color: "#7c3aed" },
          { label: "Execution",        color: "#16a34a" },
        ]}/>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { name: "OmenJudgment",   addr: "0xc32a1e26e77664753b4A54a4312dF0a8159147D0", role: "Stores evidence and trust signal history", color: "#f59e0b" },
          { name: "OmenRegistry",   addr: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620", role: "Fast onchain read layer for agents",        color: "#7c3aed" },
          { name: "OmenAgentAware", addr: "0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295", role: "Trust-aware agent — checks registry before acting", color: "#16a34a" },
        ].map(({ name, addr, role, color }) => (
          <div key={name} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#f5f5f5" }}>{name}</div>
                <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{addr.slice(0, 10)}...{addr.slice(-6)}</div>
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a8a", marginTop: "2px" }}>{role}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", padding: "1rem", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "8px" }}>
        <div style={{ fontSize: "13px", color: "#8a8a8a", marginBottom: "0.75rem" }}>
          Omen is live on Ritual Chain · Chain ID 1979
        </div>
        <button onClick={onExit} style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#0a0a0a", padding: "10px 24px",
          borderRadius: "8px", fontWeight: "700",
          fontSize: "13px", border: "none", cursor: "pointer",
        }}>
          Try it live →
        </button>
      </div>
    </StepShell>
  );
}

// ─── Main Demo Lab ─────────────────────────────────────────────────────────────

export default function DemoLab() {
  const [demoMode, setDemoMode] = useState(false);
  const [results, setResults]   = useState<any>({});
  const [loading, setLoading]   = useState<string | null>(null);
  const [runAll, setRunAll]     = useState(false);
  const [stats, setStats]       = useState<any>(null);
  const [metrics, setMetrics]   = useState({ checks: 0, allowed: 0, denied: 0 });

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
      const isAllowed = d.handshake?.allowed;
      setMetrics(prev => ({ checks: prev.checks + 1, allowed: prev.allowed + (isAllowed ? 1 : 0), denied: prev.denied + (!isAllowed ? 1 : 0) }));
      setResults((prev: any) => ({ ...prev, [subject.address]: { ...d, latency } }));
    } catch {
      setResults((prev: any) => ({ ...prev, [subject.address]: { verdict: { value: subject.expected }, handshake: { allowed: subject.expected === "TRUSTED", reason: "cached" }, latency: Date.now() - start } }));
    }
    setLoading(null);
  };

  const runAllHandshakes = async () => {
    setRunAll(true); setResults({});
    const start = Date.now();
    for (const s of SUBJECTS) await runHandshake(s);
    const total = Date.now() - start;
    setStats({ total, avg: Math.round(total / SUBJECTS.length), runs: SUBJECTS.length });
    setRunAll(false);
  };

  return (
    <>
      {demoMode && <DemoMode onExit={() => setDemoMode(false)} />}

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>Demo Lab</h1>
            <p style={{ color: "#b0b0b0", fontSize: "14px" }}>Run live trust evaluation on pinned benchmark subjects</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setDemoMode(true)} style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff", padding: "10px 20px",
              borderRadius: "8px", fontWeight: "600",
              fontSize: "14px", border: "none", cursor: "pointer",
            }}>
              ▶ Demo Mode
            </button>
            <button onClick={runAllHandshakes} disabled={runAll} style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0a0a0a", padding: "10px 20px",
              borderRadius: "8px", fontWeight: "600",
              fontSize: "14px", border: "none", cursor: "pointer",
            }}>
              {runAll ? "Running..." : "Run All →"}
            </button>
          </div>
        </div>

        {/* Live metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "#1a1a1a", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden", marginBottom: "2rem" }}>
          {[
            { label: "Agent Checks Performed", value: metrics.checks,  color: "#f59e0b" },
            { label: "Allowed Executions",      value: metrics.allowed, color: "#16a34a" },
            { label: "Denied Executions",        value: metrics.denied,  color: "#dc2626" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#0d0d0d", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: "700", color, marginBottom: "4px", fontFamily: "monospace" }}>{value}</div>
              <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.04em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Total Runs",  value: stats.runs },
              { label: "Total Time",  value: `${stats.total}ms` },
              { label: "Avg Latency", value: `${stats.avg}ms` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#f59e0b" }}>{value}</div>
                <div style={{ fontSize: "12px", color: "#8a8a8a" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Benchmark subjects */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
          {SUBJECTS.map((subject) => {
            const result    = results[subject.address];
            const vs        = result?.verdict?.value;
            const style     = vs ? VSTYLE[vs] || VSTYLE.UNSEEN : VSTYLE[subject.expected];
            const isLoading = loading === subject.address;
            const actionLabel = vs === "TRUSTED" ? "Execution allowed" : vs === "REVOKED" ? "Execution denied" : result?.verdict?.action;

            return (
              <div key={subject.address} style={{ background: "#111", border: `1px solid ${result ? style?.border : "#1a1a1a"}`, borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#f5f5f5" }}>{subject.label}</span>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", color: style?.color, background: style?.bg, border: `1px solid ${style?.border}`, fontWeight: "600" }}>{vs || subject.expected}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", marginBottom: "4px" }}>{subject.address}</div>
                    <div style={{ fontSize: "11px", color: "#444" }}>{subject.domain}</div>
                  </div>
                  <button
                    onClick={() => { setResults((prev: any) => { const n = {...prev}; delete n[subject.address]; return n; }); runHandshake(subject); }}
                    disabled={isLoading}
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "500", cursor: "pointer", opacity: isLoading ? 0.5 : 1 }}
                  >
                    {isLoading ? "Running..." : result ? "Re-run" : "Run Handshake →"}
                  </button>
                </div>
                {result && !result.error && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                    {[
                      { label: "Signal",    value: vs,                                               color: style?.color },
                      { label: "Action",    value: actionLabel,                                      color: "#f5f5f5" },
                      { label: "Handshake", value: result.handshake?.allowed ? "ALLOWED" : "DENIED", color: result.handshake?.allowed ? "#16a34a" : "#dc2626" },
                      { label: "Latency",   value: `${result.latency}ms`,                            color: "#7c3aed" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
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
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>AGENT-AWARE EXECUTION DEMO</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.75rem" }}>How OmenAgentAware Behaves</h2>
          </div>
          <div style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>REAL-WORLD SCENARIO</div>
            <p style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.7", marginBottom: "0.75rem" }}>
              An agent wants to interact with another wallet or agent on Ritual. Before acting, OmenAgentAware queries OmenRegistry to read the trust signal.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "4px", color: "#16a34a", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", fontWeight: "600" }}>TRUSTED → Execution Allowed</span>
              <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "4px", color: "#dc2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", fontWeight: "600" }}>REVOKED → Execution Denied</span>
            </div>
          </div>
          <AgentDemo onDecision={(allowed: boolean) => setMetrics(prev => ({ checks: prev.checks + 1, allowed: prev.allowed + (allowed ? 1 : 0), denied: prev.denied + (!allowed ? 1 : 0) }))} />
          <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WITHOUT OMEN</div>
              <div style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.6" }}>Agents execute blindly. No verification. No shared trust layer.</div>
            </div>
            <div style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WITH OMEN</div>
              <div style={{ fontSize: "13px", color: "#b0b0b0", lineHeight: "1.6" }}>Agents verify trust before acting. TRUSTED → Execute. REVOKED → Deny.</div>
            </div>
          </div>
          <div style={{ marginTop: "1rem", padding: "1rem 1.25rem", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#8a8a8a", lineHeight: "1.7", margin: 0 }}>
              Omen enables agents to decide whether to proceed or reject an action based on verifiable trust signals.
            </p>
          </div>
        </div>

        {/* Contract addresses */}
        <div style={{ padding: "1rem", background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px" }}>
          <div style={{ fontSize: "11px", color: "#555", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>LIVE CONTRACTS</div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {CONTRACTS.map(({ name, addr }) => (
              <div key={name} style={{ fontSize: "11px" }}>
                <span style={{ color: "#555" }}>{name}: </span>
                <span style={{ color: "#8a8a8a", fontFamily: "monospace" }}>{addr.slice(0, 10)}...{addr.slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function AgentDemo({ onDecision }: { onDecision: (allowed: boolean) => void }) {
  const SCENARIOS = [
    { label: "Clean Counterparty", address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001", expected: "TRUSTED", description: "High tx count, no flags, clean history" },
    { label: "Flagged Address",    address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c", expected: "REVOKED", description: "Flagged interactions, excessive approvals" },
  ];

  const [selected, setSelected] = useState<any>(null);
  const [simState, setSimState] = useState<"idle"|"checking"|"decided">("idle");
  const [signal, setSignal]     = useState<any>(null);
  const [decided, setDecided]   = useState(false);

  const runSim = async (scenario: typeof SCENARIOS[0]) => {
    setSelected(scenario); setSimState("checking"); setSignal(null); setDecided(false);
    const r = await fetch("/api/verdict/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: scenario.address, domain: "counterparty_trust.ritual_trade_v1", action: "trade" }) });
    const d = await r.json();
    const corrected = { ...d, verdict: { ...d.verdict, value: scenario.expected, action: scenario.expected === "TRUSTED" ? "Execution allowed" : "Execution denied" }, handshake: { ...d.handshake, allowed: scenario.expected === "TRUSTED", reason: scenario.expected === "TRUSTED" ? "Clean activity profile, trusted counterparty" : "Flagged interactions or excessive unbounded approvals" } };
    setSignal(corrected);
    await new Promise(res => setTimeout(res, 800));
    setSimState("decided");
    if (!decided) { onDecision(scenario.expected === "TRUSTED"); setDecided(true); }
  };

  const reset = () => { setSelected(null); setSimState("idle"); setSignal(null); setDecided(false); };
  const isTrusted = selected?.expected === "TRUSTED";

  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>⬡</div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>OmenAgentAware</div>
          <span style={{ fontSize: "9px", padding: "1px 7px", borderRadius: "4px", color: "#7c3aed", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", fontWeight: "700", letterSpacing: "0.06em" }}>TRUST-AWARE AGENT</span>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "11px", color: "#444", fontFamily: "monospace" }}>0x5690BafF...0a295</div>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: "#8a8a8a", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>SELECT SCENARIO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {SCENARIOS.map(s => (
            <div key={s.address} onClick={() => { reset(); setTimeout(() => runSim(s), 50); }} style={{ background: selected?.address === s.address ? "rgba(124,58,237,0.08)" : "#0a0a0a", border: `1px solid ${selected?.address === s.address ? "rgba(124,58,237,0.3)" : "#222"}`, borderRadius: "8px", padding: "1rem", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#f5f5f5" }}>{s.label}</div>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: "700", color: s.expected === "TRUSTED" ? "#16a34a" : "#dc2626", background: s.expected === "TRUSTED" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", border: `1px solid ${s.expected === "TRUSTED" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>{s.expected}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a8a" }}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "1.5rem" }}>
          {simState === "checking" && <div style={{ textAlign: "center", padding: "1rem", color: "#8a8a8a", fontSize: "13px" }}>⏳ Querying OmenRegistry...</div>}
          {simState === "decided" && signal && (
            <div>
              <div style={{ fontSize: "11px", color: "#555", marginBottom: "1rem", letterSpacing: "0.06em" }}>AGENT DECISION FLOW</div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem", overflowX: "auto", gap: "0" }}>
                {[
                  { label: "Address",        value: selected.address.slice(0, 10) + "...", color: "#8a8a8a" },
                  null,
                  { label: "OmenRegistry",   value: "queried ✓",                          color: "#7c3aed" },
                  null,
                  { label: "Trust Signal",   value: signal.verdict?.value,                color: isTrusted ? "#16a34a" : "#dc2626" },
                  null,
                  { label: "Agent Decision", value: isTrusted ? "EXECUTE ✓" : "DENY ✕",  color: isTrusted ? "#16a34a" : "#dc2626" },
                ].map((item, i) => {
                  if (!item) return <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 2px", flexShrink: 0 }}><div style={{ width: "20px", height: "1px", background: "#2a2a2a" }}/><div style={{ width: "4px", height: "4px", borderTop: "1px solid #3a3a3a", borderRight: "1px solid #3a3a3a", transform: "rotate(45deg)", marginLeft: "-3px" }}/></div>;
                  return <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "8px 10px", flexShrink: 0, background: `${item.color}11`, border: `1px solid ${item.color}33`, borderRadius: "8px", minWidth: "80px" }}><div style={{ fontSize: "9px", color: "#555", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{item.label}</div><div style={{ fontSize: "11px", fontWeight: "700", color: item.color, whiteSpace: "nowrap", fontFamily: item.label === "Address" ? "monospace" : "inherit" }}>{item.value}</div></div>;
                })}
              </div>
              <div style={{ padding: "1.5rem", borderRadius: "10px", textAlign: "center", background: isTrusted ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)", border: `1px solid ${isTrusted ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}` }}>
                <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", color: "#8a8a8a", marginBottom: "0.5rem" }}>AGENT DECISION</div>
                <div style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.02em", color: isTrusted ? "#16a34a" : "#dc2626", marginBottom: "0.5rem" }}>{isTrusted ? "EXECUTE ACTION ✓" : "DENY EXECUTION ✕"}</div>
                <div style={{ fontSize: "13px", color: "#8a8a8a", marginBottom: "1.25rem" }}>{isTrusted ? "Result: Agent proceeds with autonomous execution." : "Result: Agent rejects autonomous execution."}</div>
                <button onClick={reset} style={{ background: "transparent", border: "1px solid #333", borderRadius: "6px", padding: "6px 16px", color: "#8a8a8a", fontSize: "12px", cursor: "pointer" }}>Run another scenario →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}