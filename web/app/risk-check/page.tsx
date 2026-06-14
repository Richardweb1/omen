"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Check, Clipboard, FileCode2, RefreshCw, ShieldAlert, Wallet } from "lucide-react";
import { getAddress } from "viem";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";

type AgentDecision = "ALLOW" | "REVIEW" | "BLOCK";
type OverallRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type FindingSeverity = OverallRisk | "INFO";

type RiskFinding = {
  severity: FindingSeverity;
  title: string;
  area: string;
  whyItMatters: string;
  scenario: string;
  recommendedFix: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

type RiskReport = {
  overallRisk: OverallRisk;
  agentDecision: AgentDecision;
  launchRecommendation: string;
  summary: string;
  topIssue: string;
  findings: RiskFinding[];
  recommendedFixes: string[];
};

type RiskResponse = {
  report: RiskReport;
  disclaimer: string;
  privacy: string;
  provider: "openrouter" | "openai";
  model: string;
};

const severityOrder: FindingSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

type RiskFlowState = "walletRequired" | "inputReady" | "signatureRequired" | "reviewing" | "reportReady" | "error";

function decisionText(decision: AgentDecision) {
  if (decision === "ALLOW") return "No critical/high issues detected by this review.";
  if (decision === "BLOCK") return "Critical or dangerous issues detected. Do not launch or allow autonomous agent interaction until fixed.";
  return "Potential issues require manual review before agent interaction.";
}

function reportAsText(report: RiskReport) {
  return [
    "Omen Agent Contract Risk Check",
    `Agent Decision: ${report.agentDecision}`,
    `Overall Risk: ${report.overallRisk}`,
    `Summary: ${report.summary}`,
    `Top Issue: ${report.topIssue}`,
    `Launch Recommendation: ${report.launchRecommendation}`,
    "",
    "Findings:",
    ...report.findings.map(
      (finding, index) =>
        `${index + 1}. [${finding.severity}] ${finding.title}\nArea: ${finding.area}\nWhy it matters: ${finding.whyItMatters}\nScenario: ${finding.scenario}\nFix: ${finding.recommendedFix}\nConfidence: ${finding.confidence}`,
    ),
    "",
    "Recommended fixes:",
    ...report.recommendedFixes.map((fix) => `- ${fix}`),
    "",
    "Disclaimer: This is a pre-launch risk review, not a formal audit guarantee.",
  ].join("\n");
}

function buildReviewMessage(walletAddress: string, contractName: string, timestamp: string, nonce: string) {
  return [
    "Omen Contract Risk Check",
    "",
    "I request a pre-interaction contract risk review.",
    "",
    "This review is not a formal audit guarantee.",
    "",
    `Wallet: ${walletAddress}`,
    `Contract name: ${contractName || "Untitled"}`,
    `Timestamp: ${timestamp}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

function makeNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function RiskCheckPage() {
  const { address, isConnected } = useAccount();
  const { connectAsync, isPending: connecting } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const [contractName, setContractName] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flowState, setFlowState] = useState<RiskFlowState>("walletRequired");

  const findingsBySeverity = useMemo(() => {
    const findings = result?.report.findings || [];
    return severityOrder
      .map((severity) => ({ severity, findings: findings.filter((finding) => finding.severity === severity) }))
      .filter((group) => group.findings.length > 0);
  }, [result]);

  const currentStep = (() => {
    if (!isConnected) return 1;
    if (flowState === "signatureRequired") return 3;
    if (flowState === "reviewing") return 4;
    if (flowState === "reportReady") return 5;
    return 2;
  })();

  const connectWallet = async () => {
    setError("");
    try {
      await connectAsync({ connector: injected() });
      setFlowState("inputReady");
    } catch (connectError) {
      setFlowState("error");
      setError(connectError instanceof Error ? connectError.message : "Wallet connection failed.");
    }
  };

  const continueToSignature = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);

    if (!isConnected || !address) {
      setFlowState("walletRequired");
      setError("Connect your wallet to start a contract risk check.");
      return;
    }

    if (!contractCode.trim()) {
      setFlowState("inputReady");
      setError("Paste Solidity source code before continuing.");
      return;
    }

    setFlowState("signatureRequired");
  };

  const signAndRunRiskCheck = async () => {
    if (!isConnected || !address) {
      setFlowState("walletRequired");
      setError("Connect your wallet to start a contract risk check.");
      return;
    }

    const walletAddress = getAddress(address);
    const timestamp = new Date().toISOString();
    const nonce = makeNonce();
    const signedMessage = buildReviewMessage(walletAddress, contractName.trim(), timestamp, nonce);

    setLoading(true);
    setSigning(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const signature = await signMessageAsync({ message: signedMessage });
      setSigning(false);
      setFlowState("reviewing");

      const response = await fetch("/api/risk-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName,
          contractCode,
          notes,
          walletAddress,
          signature,
          signedMessage,
          nonce,
          timestamp,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Risk check failed");
      setResult(data as RiskResponse);
      setFlowState("reportReady");
    } catch (checkError) {
      setFlowState("error");
      setError(checkError instanceof Error ? checkError.message : "Risk check failed");
    } finally {
      setLoading(false);
      setSigning(false);
    }
  };

  const runAnotherCheck = () => {
    setContractName("");
    setContractCode("");
    setNotes("");
    setResult(null);
    setError("");
    setCopied(false);
    setFlowState(isConnected ? "inputReady" : "walletRequired");
  };

  const copyReport = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(reportAsText(result.report));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="risk-check-page">
      <section className="risk-check-shell">
        <div className="risk-hero">
          <div>
            <p className="mono-kicker">
              <ShieldAlert size={15} />
              Agent Contract Risk Check
            </p>
            <h1>Agent Contract Risk Check</h1>
            <p>Review a smart contract before users or agents interact with it.</p>
          </div>
          <div className="risk-note">
            <strong>Pre-launch review</strong>
            <span>This is a pre-launch risk review, not a formal audit guarantee.</span>
          </div>
        </div>

        <div className="risk-stepper" aria-label="Contract risk check steps">
          {["Connect wallet", "Paste contract", "Sign request", "Review risk"].map((label, index) => {
            const step = index + 1;
            const complete = currentStep > step;
            const active = currentStep === step;
            return (
              <div className={`risk-step ${complete ? "complete" : ""} ${active ? "active" : ""}`} key={label}>
                <span>{complete ? <Check size={14} /> : step}</span>
                {label}
              </div>
            );
          })}
        </div>

        <section className="risk-connect-panel">
          <div>
            <p className="mono-kicker">Step 1</p>
            <h2>Connect wallet</h2>
            <p>{isConnected && address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "Connect your wallet to start a contract risk check."}</p>
          </div>
          {!isConnected ? (
            <button className="trust-submit" type="button" onClick={() => void connectWallet()} disabled={connecting}>
              {connecting ? <RefreshCw size={18} className="spin-icon" /> : <Wallet size={18} />}
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="risk-connected-badge">
              <Check size={16} />
              Wallet connected
            </div>
          )}
        </section>

        <form className={`risk-input-panel ${!isConnected ? "locked" : ""}`} onSubmit={continueToSignature}>
          {!isConnected && <div className="risk-locked-helper">Connect your wallet to start a contract risk check.</div>}
          <div className="risk-field-grid">
            <label className="risk-field">
              <span>Contract name optional</span>
              <input value={contractName} onChange={(event) => setContractName(event.target.value)} placeholder="OmenVault" disabled={!isConnected || loading} />
            </label>
            <label className="risk-field">
              <span>Notes/context optional</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pre-launch review before agent interaction" disabled={!isConnected || loading} />
            </label>
          </div>

          <label className="risk-field">
            <span>Solidity source code</span>
            <textarea
              value={contractCode}
              onChange={(event) => setContractCode(event.target.value)}
              placeholder={"pragma solidity ^0.8.24;\n\ncontract Example {\n  // paste contract here\n}"}
              spellCheck={false}
              disabled={!isConnected || loading}
            />
          </label>

          <div className="risk-form-footer">
            <p>Do not submit private code unless you are comfortable sharing it with the configured analysis provider.</p>
            <button className="trust-submit" type="submit" disabled={!isConnected || loading}>
              <FileCode2 size={18} />
              Continue
            </button>
          </div>
        </form>

        {(flowState === "signatureRequired" || flowState === "reviewing") && (
          <section className="risk-signature-panel">
            <div>
              <p className="mono-kicker">Step 3</p>
              <h2>Sign review request</h2>
              <p>Sign a review request to unlock the risk report.</p>
              <small>This does not cost gas, does not move funds, and does not create an OmenRegistry record.</small>
            </div>
            <button className="trust-submit" type="button" onClick={() => void signAndRunRiskCheck()} disabled={loading}>
              {loading ? <RefreshCw size={18} className="spin-icon" /> : <Wallet size={18} />}
              {signing ? "Sign Review Request" : loading ? "Reviewing contract risk..." : "Sign Review Request"}
            </button>
          </section>
        )}

        {error && (
          <div className="trust-error risk-error" role="alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {result && (
          <section className="risk-report">
            <div className="risk-report-grid">
              <article className={`risk-card decision-${result.report.agentDecision.toLowerCase()}`}>
                <span>Agent Decision</span>
                <strong>{result.report.agentDecision}</strong>
                <p>{decisionText(result.report.agentDecision)}</p>
              </article>
              <article className={`risk-card risk-${result.report.overallRisk.toLowerCase()}`}>
                <span>Overall Risk</span>
                <strong>{result.report.overallRisk}</strong>
                <p>{result.report.launchRecommendation}</p>
              </article>
              <article className="risk-card risk-summary-card">
                <span>Summary</span>
                <strong>{result.report.findings.length} findings</strong>
                <p>{result.report.summary}</p>
                <small>Top issue: {result.report.topIssue}</small>
              </article>
            </div>

            <div className="risk-section-heading">
              <div>
                <p className="mono-kicker">Findings by severity</p>
                <h2>Review before agent interaction.</h2>
              </div>
              <div className="risk-report-actions">
                <button className="refresh-button" type="button" onClick={() => void copyReport()}>
                  <Clipboard size={16} />
                  {copied ? "Copied" : "Copy report"}
                </button>
                <button className="refresh-button" type="button" onClick={runAnotherCheck}>
                  Run Another Check
                </button>
              </div>
            </div>

            {findingsBySeverity.length === 0 ? (
              <div className="risk-empty-findings">No findings were returned by this review.</div>
            ) : (
              <div className="risk-findings">
                {findingsBySeverity.map((group) => (
                  <section className="risk-finding-group" key={group.severity}>
                    <h3>{group.severity}</h3>
                    {group.findings.map((finding, index) => (
                      <article className="risk-finding" key={`${group.severity}-${finding.title}-${index}`}>
                        <div className="risk-finding-title">
                          <strong>{finding.title}</strong>
                          <span>{finding.confidence} confidence</span>
                        </div>
                        <dl>
                          <div>
                            <dt>Affected area/function</dt>
                            <dd>{finding.area}</dd>
                          </div>
                          <div>
                            <dt>Why it matters</dt>
                            <dd>{finding.whyItMatters}</dd>
                          </div>
                          <div>
                            <dt>Failure/exploit scenario</dt>
                            <dd>{finding.scenario}</dd>
                          </div>
                          <div>
                            <dt>Recommended fix</dt>
                            <dd>{finding.recommendedFix}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            )}

            <section className="risk-fixes-panel">
              <p className="mono-kicker">Recommended fixes</p>
              <ul>
                {result.report.recommendedFixes.map((fix) => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            </section>

            <div className="risk-disclaimer">
              <p>{result.disclaimer}</p>
              <p>{result.privacy}</p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
