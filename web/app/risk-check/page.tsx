"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Clipboard, FileCode2, RefreshCw, ShieldAlert } from "lucide-react";

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

export default function RiskCheckPage() {
  const [contractName, setContractName] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const findingsBySeverity = useMemo(() => {
    const findings = result?.report.findings || [];
    return severityOrder
      .map((severity) => ({ severity, findings: findings.filter((finding) => finding.severity === severity) }))
      .filter((group) => group.findings.length > 0);
  }, [result]);

  const runRiskCheck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/risk-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractName, contractCode, notes }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Risk check failed");
      setResult(data as RiskResponse);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Risk check failed");
    } finally {
      setLoading(false);
    }
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
            <h1>Contract Risk Check</h1>
            <p>Review a smart contract before users or agents interact with it.</p>
          </div>
          <div className="risk-note">
            <strong>Pre-launch review</strong>
            <span>This is a pre-launch risk review, not a formal audit guarantee.</span>
          </div>
        </div>

        <form className="risk-input-panel" onSubmit={runRiskCheck}>
          <div className="risk-field-grid">
            <label className="risk-field">
              <span>Contract name optional</span>
              <input value={contractName} onChange={(event) => setContractName(event.target.value)} placeholder="OmenVault" />
            </label>
            <label className="risk-field">
              <span>Notes/context optional</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pre-launch review before agent interaction" />
            </label>
          </div>

          <label className="risk-field">
            <span>Solidity source code</span>
            <textarea
              value={contractCode}
              onChange={(event) => setContractCode(event.target.value)}
              placeholder={"pragma solidity ^0.8.24;\n\ncontract Example {\n  // paste contract here\n}"}
              spellCheck={false}
            />
          </label>

          <div className="risk-form-footer">
            <p>Do not submit private code unless you are comfortable sharing it with the configured analysis provider.</p>
            <button className="trust-submit" type="submit" disabled={loading}>
              {loading ? <RefreshCw size={18} className="spin-icon" /> : <FileCode2 size={18} />}
              {loading ? "Reviewing contract risk..." : "Run Risk Check"}
            </button>
          </div>
        </form>

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
              <button className="refresh-button" type="button" onClick={() => void copyReport()}>
                <Clipboard size={16} />
                {copied ? "Copied" : "Copy report"}
              </button>
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
