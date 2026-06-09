"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccount, useChainId, useSendTransaction, useSwitchChain } from "wagmi";
import { encodeFunctionData } from "viem";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { JUDGMENT_ABI, JUDGMENT_ADDRESS } from "@/lib/contracts";
import { getTrustDomain } from "@/lib/trustDomains";

const RITUAL_CHAIN_ID = 1979;

type TxStatus =
  | "idle"
  | "prepared"
  | "sign_submit"
  | "confirming_submit"
  | "sign_evaluate"
  | "confirming_evaluate"
  | "confirmed"
  | "error";

type PreparedSignal = {
  verdict: {
    value: string;
    action: string;
    reasoning: string;
  };
  txData: {
    merkleRoot: `0x${string}`;
    features: number[];
    reasoning: string;
    startBlock: number;
    endBlock: number;
  };
};

type RegistryMirror = {
  verdict: {
    value: string;
    isFresh: boolean;
  };
  recommendedAction: string;
  explanation: string;
};

type InlineSignalBuilderProps = {
  subject: string;
  domain: string;
  onRecheck?: () => Promise<void> | void;
  onActivityRefresh?: () => Promise<void> | void;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Request failed");
  return data as T;
}

async function rpcCall<T>(method: string, params: unknown[]): Promise<T | null> {
  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const data = await response.json();
  return data.result ?? null;
}

async function waitForReceipt(hash: string) {
  let seenOnRitual = false;

  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const transaction = await rpcCall<unknown>("eth_getTransactionByHash", [hash]);
    if (transaction) seenOnRitual = true;

    const receipt = await rpcCall<{ status?: string }>("eth_getTransactionReceipt", [hash]);
    if (receipt?.status === "0x1") return;
    if (receipt?.status === "0x0") throw new Error("Transaction failed on Ritual");
  }

  if (!seenOnRitual) {
    throw new Error("Transaction hash was not found on Ritual. Switch your wallet to Ritual Chain and submit again.");
  }

  throw new Error("Transaction timed out");
}

export default function InlineSignalBuilder({ subject, domain, onRecheck, onActivityRefresh }: InlineSignalBuilderProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const activeDomain = useMemo(() => getTrustDomain(domain), [domain]);
  const [features, setFeatures] = useState<number[]>(() => activeDomain.defaults);
  const [prepared, setPrepared] = useState<PreparedSignal | null>(null);
  const [mirror, setMirror] = useState<RegistryMirror | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [tx1Hash, setTx1Hash] = useState("");
  const [tx2Hash, setTx2Hash] = useState("");
  const [error, setError] = useState("");

  const updateFeature = (index: number, value: string) => {
    const next = [...features];
    next[index] = Math.max(0, Number.parseInt(value || "0", 10));
    setFeatures(next);
    setPrepared(null);
    setMirror(null);
    setTxStatus("idle");
  };

  const prepareSignal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPrepared(null);
    setMirror(null);
    setTxStatus("idle");
    setTx1Hash("");
    setTx2Hash("");

    if (!subject) {
      setError("Paste an address before preparing a signal update.");
      return;
    }

    try {
      const nextPrepared = await postJson<PreparedSignal>("/api/verdict/evaluate", { subject, domain, features });
      setPrepared(nextPrepared);
      setTxStatus("prepared");
    } catch (prepareError) {
      setError(prepareError instanceof Error ? prepareError.message : "Could not prepare signal");
    }
  };

  const signAndSubmit = async () => {
    if (!prepared) return;
    if (!isConnected) {
      setError("Connect your wallet before signing.");
      return;
    }

    setError("");

    try {
      if (chainId !== RITUAL_CHAIN_ID) {
        setTxStatus("idle");
        try {
          await switchChainAsync({ chainId: RITUAL_CHAIN_ID });
        } catch {
          throw new Error("Switch your wallet to Ritual Chain 1979 before signing.");
        }
      }

      setTxStatus("sign_submit");
      const data1 = encodeFunctionData({
        abi: JUDGMENT_ABI,
        functionName: "submitSignal",
        args: [subject as `0x${string}`, domain, prepared.txData.merkleRoot, BigInt(prepared.txData.startBlock), BigInt(prepared.txData.endBlock)],
      });
      const hash1 = await sendTransactionAsync({ to: JUDGMENT_ADDRESS, data: data1, gas: BigInt(2_000_000) });
      setTx1Hash(hash1);

      setTxStatus("confirming_submit");
      await waitForReceipt(hash1);

      setTxStatus("sign_evaluate");
      const data2 = encodeFunctionData({
        abi: JUDGMENT_ABI,
        functionName: "evaluateDeterministic",
        args: [subject as `0x${string}`, domain, prepared.txData.features.map((feature) => BigInt(feature)), prepared.txData.reasoning],
      });
      const hash2 = await sendTransactionAsync({ to: JUDGMENT_ADDRESS, data: data2, gas: BigInt(2_000_000) });
      setTx2Hash(hash2);

      setTxStatus("confirming_evaluate");
      await waitForReceipt(hash2);

      const registryResult = await postJson<RegistryMirror>("/api/verdict/read", { subject, domain, action: activeDomain.action });
      setMirror(registryResult);
      setTxStatus("confirmed");
      await onRecheck?.();
      await onActivityRefresh?.();
    } catch (submitError) {
      setTxStatus("error");
      const message = submitError instanceof Error ? submitError.message : "Transaction failed";
      setError(message.includes("User rejected") || message.includes("user rejected") ? "Transaction rejected in wallet." : message.slice(0, 160));
    }
  };

  const manualRecheck = async () => {
    setError("");
    try {
      await onRecheck?.();
      await onActivityRefresh?.();
    } catch (recheckError) {
      setError(recheckError instanceof Error ? recheckError.message : "Could not re-check OmenRegistry");
    }
  };

  const txStatusLabel: Record<TxStatus, string> = {
    idle: "Prepare a registry signal update for a wallet-signed transaction.",
    prepared: "Signal update prepared. Connect your wallet and sign both transactions.",
    sign_submit: "Waiting for wallet signature: submitSignal.",
    confirming_submit: "submitSignal is confirming on Ritual.",
    sign_evaluate: "Waiting for wallet signature: evaluateDeterministic.",
    confirming_evaluate: "evaluateDeterministic is confirming on Ritual.",
    confirmed: "Trust signal written and read back from OmenRegistry.",
    error: "Build or refresh stopped because an error occurred.",
  };

  const steps = [
    { key: "prepare", label: "Prepare signal update", active: txStatus === "idle" || txStatus === "prepared", done: Boolean(prepared) },
    { key: "submit", label: "Submit signal", active: txStatus === "sign_submit" || txStatus === "confirming_submit", done: Boolean(tx1Hash) },
    { key: "evaluate", label: "Evaluate/update registry", active: txStatus === "sign_evaluate" || txStatus === "confirming_evaluate", done: Boolean(tx2Hash) },
    { key: "recheck", label: "Re-check result", active: txStatus === "confirmed", done: txStatus === "confirmed" },
  ];

  return (
    <section className="inline-builder-panel">
      <div className="inline-builder-header">
        <div>
          <p className="mono-kicker">Build or refresh signal</p>
          <h2>Build or refresh registry signal</h2>
        </div>
        <p>
          Omen prepares a registry-backed signal update for the selected address and domain. Your connected wallet signs every write and pays gas on
          Ritual.
        </p>
      </div>

      <form className="inline-builder-form simplified-builder-form" onSubmit={prepareSignal}>
        <div className="signal-update-summary">
          <span>Selected update</span>
          <b>{activeDomain.label}</b>
          <p>Confirmed onchain records cannot be deleted. Refreshing creates a new registry update for the selected address and domain.</p>
        </div>

        <button className="trust-submit" type="submit">
          Prepare Signal Update <ArrowRight size={18} />
        </button>

        <details className="advanced-signal-inputs">
          <summary>Advanced: signal inputs</summary>
          <p>These bounded inputs are used internally to prepare the registry update. Most users can keep the defaults.</p>
          <div className="evidence-grid">
            {activeDomain.features.map((name, index) => (
              <label className="evidence-field" key={name}>
                <span>{name}</span>
                <input type="number" min="0" step="1" value={features[index]} onChange={(event) => updateFeature(index, event.target.value)} />
              </label>
            ))}
          </div>
        </details>
      </form>

      <div className="workflow-steps">
        {steps.map((step) => (
          <div className={`workflow-step ${step.done ? "done" : ""} ${step.active ? "active" : ""}`} key={step.key}>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {error && <div className="trust-error">{error}</div>}

      <section className="builder-status-card inline-status-card">
        <div className="panel-heading">
          <span>Transaction Status</span>
          {txStatus === "confirming_submit" || txStatus === "confirming_evaluate" ? <RefreshCw size={18} className="spin-icon" /> : null}
        </div>
        <p>{txStatusLabel[txStatus]}</p>

        {prepared && (
          <div className="prepared-grid">
            <div>
              <span>Preview Signal</span>
              <b>{prepared.verdict.value}</b>
            </div>
            <div>
              <span>Recommended Action</span>
              <b>{prepared.verdict.action}</b>
            </div>
            <div>
              <span>Evidence Hash</span>
              <b>{prepared.txData.merkleRoot.slice(0, 18)}...</b>
            </div>
            <div>
              <span>Block Window</span>
              <b>
                {prepared.txData.startBlock} - {prepared.txData.endBlock}
              </b>
            </div>
          </div>
        )}

        {prepared && txStatus !== "confirmed" && (
          <button className="trust-submit secondary-submit" type="button" onClick={signAndSubmit}>
            Sign and Submit <ArrowRight size={18} />
          </button>
        )}

        {(tx1Hash || tx2Hash) && (
          <div className="tx-links">
            {tx1Hash && (
              <a href={`https://explorer.ritualfoundation.org/tx/${tx1Hash}`} target="_blank" rel="noreferrer">
                submitSignal transaction <ExternalLink size={15} />
              </a>
            )}
            {tx2Hash && (
              <a href={`https://explorer.ritualfoundation.org/tx/${tx2Hash}`} target="_blank" rel="noreferrer">
                evaluateDeterministic transaction <ExternalLink size={15} />
              </a>
            )}
          </div>
        )}

        {mirror && (
          <div className="mirror-result">
            <span>OmenRegistry readback</span>
            <strong>{mirror.verdict.value}</strong>
            <p>
              {mirror.recommendedAction} - {mirror.explanation} Fresh: {mirror.verdict.isFresh ? "Yes" : "No"}
            </p>
          </div>
        )}

        {txStatus === "confirmed" && (
          <button className="refresh-button recheck-button" type="button" onClick={() => void manualRecheck()}>
            <RefreshCw size={16} />
            Re-check OmenRegistry
          </button>
        )}
      </section>
    </section>
  );
}
