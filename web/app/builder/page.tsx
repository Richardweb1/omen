"use client";
import { useState, useEffect } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import { encodeFunctionData } from "viem";
import { JUDGMENT_ADDRESS, JUDGMENT_ABI } from "@/lib/contracts";

const API = '/api';

const VERDICT_STYLE: any = {
  TRUSTED: { color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"  },
  REVOKED: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"  },
  PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)" },
  UNSEEN:  { color: "#666666", bg: "rgba(102,102,102,0.1)", border: "rgba(102,102,102,0.3)"},
  LAPSED:  { color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.3)" },
};

type TxStatus =
  | "idle"
  | "preparing"
  | "sign_submit"
  | "confirming_submit"
  | "sign_evaluate"
  | "confirming_evaluate"
  | "confirmed"
  | "error";

export default function Builder() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [subject, setSubject]   = useState("");
  const [domain, setDomain]     = useState("counterparty_trust.ritual_trade_v1");
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState<any>(null);
  const [signal, setSignal]     = useState<any>(null);
  const [verdict, setVerdict]   = useState<any>(null);
  const [mirror, setMirror]     = useState<any>(null);
  const [error, setError]       = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [tx1Hash, setTx1Hash]   = useState<string>("");
  const [tx2Hash, setTx2Hash]   = useState<string>("");
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (address) setSubject(address); }, [address]);

  const reset = () => {
    setStep(0); setSummary(null); setSignal(null);
    setVerdict(null); setMirror(null); setError("");
    setTxStatus("idle"); setTx1Hash(""); setTx2Hash("");
  };

  const call = async (url: string, body: any) => {
    const r = await fetch(`${API}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d;
  };

  const step1 = async () => {
    if (!subject) return setError("Enter a wallet address");
    setLoading(true); setError("");
    try {
      const d = await call("/signal/summary", { subject, domain });
      setSummary(d); setStep(1);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const step2 = async () => {
    setLoading(true); setError("");
    try {
      const d = await call("/signal/build", { subject, domain });
      setSignal(d); setStep(2);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const step3 = async () => {
    if (!isConnected) return setError("Please connect your wallet first");
    setLoading(true); setError(""); setTxStatus("preparing");

    try {
      // Get prepared data from server
      const d = await call("/verdict/evaluate", { subject, domain });
      setVerdict(d);

      const { merkleRoot, features, reasoning, startBlock, endBlock } = d.txData;

      // TX 1 — submitSignal — encode + send raw (no simulation)
      setTxStatus("sign_submit");
      const data1 = encodeFunctionData({
        abi: JUDGMENT_ABI,
        functionName: "submitSignal",
        args: [
          subject as `0x${string}`,
          domain,
          merkleRoot as `0x${string}`,
          BigInt(startBlock),
          BigInt(endBlock),
        ],
      });

      const hash1 = await sendTransactionAsync({
        to: JUDGMENT_ADDRESS,
        data: data1,
        gas: BigInt(2_000_000),
      });
      setTx1Hash(hash1);

      // Wait for TX 1
      setTxStatus("confirming_submit");
      let confirmed1 = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const res = await fetch("/api/rpc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [hash1], id: 1 }),
          });
          const data = await res.json();
          if (data.result?.status === "0x1") { confirmed1 = true; break; }
          if (data.result?.status === "0x0") throw new Error("submitSignal transaction failed");
        } catch {}
      }
      if (!confirmed1) throw new Error("submitSignal timed out");

      // TX 2 — evaluateDeterministic — encode + send raw
      setTxStatus("sign_evaluate");
      const data2 = encodeFunctionData({
        abi: JUDGMENT_ABI,
        functionName: "evaluateDeterministic",
        args: [
          subject as `0x${string}`,
          domain,
          features.map((f: number) => BigInt(f)),
          reasoning,
        ],
      });

      const hash2 = await sendTransactionAsync({
        to: JUDGMENT_ADDRESS,
        data: data2,
        gas: BigInt(2_000_000),
      });
      setTx2Hash(hash2);

      // Wait for TX 2
      setTxStatus("confirming_evaluate");
      let confirmed2 = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const res = await fetch("/api/rpc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [hash2], id: 1 }),
          });
          const data = await res.json();
          if (data.result?.status === "0x1") { confirmed2 = true; break; }
          if (data.result?.status === "0x0") throw new Error("evaluateDeterministic transaction failed");
        } catch {}
      }
      if (!confirmed2) throw new Error("evaluateDeterministic timed out");

      setTxStatus("confirmed");
      setStep(3);

    } catch (e: any) {
      setTxStatus("error");
      setError(
        e.message?.includes("User rejected") || e.message?.includes("user rejected")
          ? "Transaction rejected — you cancelled the wallet popup."
          : e.message?.slice(0, 120)
      );
    }
    setLoading(false);
  };

  const step4 = async () => {
    setLoading(true); setError("");
    try {
      const d = await call("/verdict/read", { subject, domain, action: "trade" });
      setMirror(d); setStep(4);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const vs = verdict?.verdict?.value || summary?.preview?.verdict;
  const style = vs ? VERDICT_STYLE[vs] || VERDICT_STYLE.UNSEEN : null;

  const txStatusMessage: Record<TxStatus, string> = {
    idle:                "",
    preparing:           "⏳ Preparing trust signal data...",
    sign_submit:         "✍️ Sign submitSignal in your wallet...",
    confirming_submit:   "⛓️ submitSignal confirming on Ritual...",
    sign_evaluate:       "✍️ Sign evaluateDeterministic in your wallet...",
    confirming_evaluate: "⛓️ evaluateDeterministic confirming on Ritual...",
    confirmed:           "✅ Trust signal confirmed onchain.",
    error:               "",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#f5f5f5", marginBottom: "0.5rem" }}>
          Verifiable Trust Signal Builder
        </h1>
        <p style={{ color: "#b0b0b0", fontSize: "14px" }}>
          Build reproducible evidence and generate a verifiable trust signal on Ritual chain
        </p>
      </div>

      {mounted && !isConnected && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#f59e0b", fontSize: "13px", marginBottom: "1rem",
        }}>
          ⚠️ Connect your wallet to sign transactions in step 3. You will pay gas.
        </div>
      )}

      <div style={{
        background: "#111", border: "1px solid #1a1a1a",
        borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "12px", color: "#8a8a8a", display: "block", marginBottom: "6px" }}>
            SUBJECT ADDRESS
          </label>
          <input
            value={subject}
            onChange={e => { setSubject(e.target.value); reset(); }}
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
        <div>
          <label style={{ fontSize: "12px", color: "#8a8a8a", display: "block", marginBottom: "6px" }}>
            DOMAIN
          </label>
          <select
            value={domain}
            onChange={e => { setDomain(e.target.value); reset(); }}
            style={{
              width: "100%", background: "#0a0a0a",
              border: "1px solid #222", borderRadius: "8px",
              padding: "10px 14px", color: "#f5f5f5",
              fontSize: "13px", outline: "none",
              boxSizing: "border-box",
            }}
          >
            <option value="counterparty_trust.ritual_trade_v1">Counterparty Trust — trade</option>
            <option value="agent_safety.ritual_infernet_v1">Agent Safety — execute</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px", padding: "10px 14px",
          color: "#dc2626", fontSize: "13px", marginBottom: "1rem",
        }}>{error}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        <StepCard num="1" title="Build Evidence Summary" active={step === 0} done={step > 0} onRun={step1} loading={loading && step === 0}>
          {summary && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {Object.entries(summary.features).map(([k, v]) => (
                  <div key={k} style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: "6px", padding: "4px 10px", fontSize: "12px" }}>
                    <span style={{ color: "#8a8a8a" }}>{k}: </span>
                    <span style={{ color: "#f5f5f5" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "#8a8a8a", fontFamily: "monospace" }}>
                merkle: {summary.merkleRoot?.slice(0, 20)}...
              </div>
            </div>
          )}
        </StepCard>

        <StepCard num="2" title="Build SignalObject" active={step === 1} done={step > 1} onRun={step2} loading={loading && step === 1} disabled={step < 1}>
          {signal && (
            <div style={{ fontSize: "12px", color: "#b0b0b0" }}>
              <div>Type: <span style={{ color: "#f5f5f5" }}>{signal.type}</span></div>
              <div>Version: <span style={{ color: "#f5f5f5" }}>{signal.version}</span></div>
              <div>Blocks: <span style={{ color: "#f5f5f5" }}>{signal.blockWindow?.startBlock} → {signal.blockWindow?.endBlock}</span></div>
              <div style={{ marginTop: "0.5rem", padding: "8px", background: "#0a0a0a", borderRadius: "6px", border: "1px solid #222" }}>
                Preview: <span style={{ color: style?.color || "#b0b0b0", fontWeight: "600" }}>{signal.readingArtifact?.verdict}</span>
                <span style={{ color: "#8a8a8a", marginLeft: "8px", fontSize: "11px" }}>{signal.readingArtifact?.reasoning}</span>
              </div>
            </div>
          )}
        </StepCard>

        <StepCard num="3" title="Generate Trust Signal on Ritual" active={step === 2} done={step > 2} onRun={step3} loading={loading && step === 2} disabled={step < 2}>
          {step === 2 && txStatus === "idle" && (
            <div style={{
              background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "8px", padding: "14px 16px",
              marginBottom: "0.75rem",
            }}>
              <div style={{
                fontSize: "11px", fontWeight: "700", color: "#7c3aed",
                letterSpacing: "0.08em", marginBottom: "6px",
              }}>
                WALLET-SIGNED TRANSACTIONS
              </div>
              <div style={{ fontSize: "12px", color: "#b0b0b0", lineHeight: "1.7" }}>
                You will sign two transactions from your connected wallet. Omen never uses a backend wallet to pay gas. All onchain actions are authorized and paid for by the connected user.
              </div>
            </div>
          )}
          {txStatus !== "idle" && txStatus !== "error" && (
            <div style={{
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "8px", padding: "10px 14px",
              color: "#cfcfcf", fontSize: "13px", marginBottom: "0.75rem",
            }}>
              {txStatusMessage[txStatus]}
            </div>
          )}
          {verdict && step > 2 && (
            <div>
              <div style={{
                display: "inline-block", padding: "6px 16px", borderRadius: "6px",
                fontSize: "14px", fontWeight: "700",
                color: style?.color, background: style?.bg,
                border: `1px solid ${style?.border}`, marginBottom: "0.75rem",
              }}>
                {verdict.verdict?.value} — {verdict.verdict?.action}
              </div>
              <div style={{ fontSize: "12px", color: "#b0b0b0", marginBottom: "0.75rem" }}>
                {verdict.verdict?.reasoning}
              </div>
              {tx1Hash && (
                <div style={{ fontSize: "11px", fontFamily: "monospace" }}>
                  <a href={`https://explorer.ritualfoundation.org/tx/${tx1Hash}`} target="_blank" style={{ color: "#7c3aed", display: "block" }}>
                    tx1 submitSignal: {tx1Hash.slice(0, 20)}... ↗
                  </a>
                  {tx2Hash && (
                    <a href={`https://explorer.ritualfoundation.org/tx/${tx2Hash}`} target="_blank" style={{ color: "#7c3aed", display: "block" }}>
                      tx2 evaluateDeterministic: {tx2Hash.slice(0, 20)}... ↗
                    </a>
                  )}
                  <div style={{
                    marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap",
                  }}>
                    {[
                      { label: "✓ Signed by connected wallet", color: "#16a34a" },
                      { label: "✓ Gas paid by user",           color: "#16a34a" },
                      { label: "✓ Written on Ritual Chain",    color: "#7c3aed" },
                    ].map(({ label, color }) => (
                      <span key={label} style={{
                        fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                        color, border: `1px solid ${color}33`,
                        background: `${color}11`, fontWeight: "500",
                      }}>{label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        <StepCard num="4" title="Read Trust Signal from OmenRegistry" active={step === 3} done={step > 3} onRun={step4} loading={loading && step === 3} disabled={step < 3}>
          {mirror && (
            <div style={{ fontSize: "12px", color: "#b0b0b0" }}>
              <div>Trust Signal: <span style={{ color: style?.color, fontWeight: "600" }}>{mirror.verdict?.value}</span></div>
              <div>Fresh: <span style={{ color: mirror.verdict?.isFresh ? "#16a34a" : "#dc2626" }}>{mirror.verdict?.isFresh ? "Yes" : "No"}</span></div>
              <div style={{ marginTop: "0.5rem", padding: "8px", background: "#0a0a0a", borderRadius: "6px", border: "1px solid #222" }}>
                Handshake: <span style={{ color: mirror.handshake?.allowed ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                  {mirror.handshake?.allowed ? "ALLOWED" : "DENIED"}
                </span>
                <div style={{ color: "#8a8a8a", fontSize: "11px", marginTop: "2px" }}>{mirror.handshake?.reason}</div>
              </div>
            </div>
          )}
        </StepCard>

      </div>
    </div>
  );
}

function StepCard({ num, title, active, done, onRun, loading, disabled, children }: any) {
  return (
    <div style={{
      background: "#111",
      border: `1px solid ${active ? "rgba(245,158,11,0.3)" : done ? "rgba(22,163,74,0.2)" : "#1a1a1a"}`,
      borderRadius: "12px", padding: "1.25rem",
      opacity: disabled ? 0.4 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: children ? "1rem" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "50%",
            background: done ? "rgba(22,163,74,0.2)" : active ? "rgba(245,158,11,0.2)" : "#1a1a1a",
            border: `1px solid ${done ? "rgba(22,163,74,0.4)" : active ? "rgba(245,158,11,0.4)" : "#333"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: "700",
            color: done ? "#16a34a" : active ? "#f59e0b" : "#555",
          }}>
            {done ? "✓" : num}
          </div>
          <span style={{ fontSize: "14px", fontWeight: "500", color: active ? "#f5f5f5" : done ? "#999" : "#8a8a8a" }}>
            {title}
          </span>
        </div>
        {(active || done) && !disabled && (
          <button onClick={onRun} disabled={loading || done} style={{
            background: done ? "transparent" : "rgba(245,158,11,0.15)",
            border: `1px solid ${done ? "#333" : "rgba(245,158,11,0.3)"}`,
            color: done ? "#555" : "#f59e0b",
            padding: "6px 14px", borderRadius: "6px",
            fontSize: "12px", fontWeight: "500",
            cursor: done ? "default" : "pointer",
          }}>
            {loading ? "Running..." : done ? "Done" : "Run →"}
          </button>
        )}
        {!active && !done && !disabled && (
          <button onClick={onRun} style={{
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            color: "#f59e0b", padding: "6px 14px",
            borderRadius: "6px", fontSize: "12px",
            fontWeight: "500", cursor: "pointer",
          }}>
            {loading ? "Running..." : "Run →"}
          </button>
        )}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}