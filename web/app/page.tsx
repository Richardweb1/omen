"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  ExternalLink,
  FileCode2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { getAddress } from "viem";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import TrustReceiptMinter from "@/components/TrustReceiptMinter";
import { getTrustDomain, trustDomains } from "@/lib/trustDomains";

type VerdictValue = "TRUSTED" | "REVOKED" | "PENDING" | "UNSEEN" | "LAPSED";

type Health = {
  status?: string;
  block?: number;
  contracts?: {
    registry?: string;
    judgment?: string;
  };
};

type TrustResult = {
  subject: string;
  domain: string;
  source: "OmenRegistry";
  registry: string;
  explorer: string;
  recommendedAction: string;
  explanation: string;
  verdict: {
    value: VerdictValue;
    rawValue: VerdictValue;
    timestamp: number;
    isFresh: boolean;
    hasRecord: boolean;
  };
  handshake: {
    allowed: boolean;
    reason: string;
    action: string;
  };
};

type AddressActivitySummary = {
  address: string;
  outgoingTxCount: number;
  txCountSource: string;
  txCountLabel: string;
  reliability: string;
  stakeActivity: "Not verified";
  donationActivity: "Not verified";
  swapActivity: "Not verified";
  notes: string;
};

type ContractSourceResponse = {
  address: string;
  chainId: string;
  network?: string;
  isContract: boolean;
  verified: boolean;
  contractName?: string;
  compilerVersion?: string;
  sourceCode?: string;
  sourceType?: "single-file" | "multi-file-json";
  sourceStatus?: "not_checked";
  explorer?: string;
  error?: string;
  proxy?: {
    isProxy: boolean;
    implementationAddress?: string;
  };
};

type ContractRiskFinding = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  recommendedFix: string;
};

type ContractRiskResponse = {
  report: {
    overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    agentDecision: "ALLOW" | "REVIEW" | "BLOCK";
    launchRecommendation: string;
    findings: ContractRiskFinding[];
  };
};

const statusClass: Record<VerdictValue | string, string> = {
  TRUSTED: "trusted",
  REVOKED: "revoked",
  PENDING: "pending",
  UNSEEN: "unseen",
  LAPSED: "lapsed",
  REVIEW: "pending",
};

const contractSourceNetworks = [
  { label: "Ritual", value: "1979" },
  { label: "Ethereum", value: "1" },
  { label: "Sepolia", value: "11155111" },
  { label: "Base", value: "8453" },
  { label: "Arbitrum", value: "42161" },
  { label: "Optimism", value: "10" },
  { label: "Polygon", value: "137" },
  { label: "BSC", value: "56" },
];

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function buildRiskReviewMessage(walletAddress: string, timestamp: string, nonce: string) {
  return [
    "Omen Contract Risk Check",
    "",
    "I request a pre-interaction contract risk review.",
    "",
    "This review is not a formal audit guarantee.",
    "",
    `Wallet: ${walletAddress}`,
    `Timestamp: ${timestamp}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

function makeNonce() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const { address: connectedWallet, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const [health, setHealth] = useState<Health | null>(null);
  const [subject, setSubject] = useState("");
  const [domain, setDomain] = useState(trustDomains[0].value);
  const [result, setResult] = useState<TrustResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressActivity, setAddressActivity] = useState<AddressActivitySummary | null>(null);
  const [addressActivityLoading, setAddressActivityLoading] = useState(false);
  const [addressActivityError, setAddressActivityError] = useState("");
  const [contractSource, setContractSource] = useState<ContractSourceResponse | null>(null);
  const [contractSourceLoading, setContractSourceLoading] = useState(false);
  const [contractSourceLookupLoading, setContractSourceLookupLoading] = useState(false);
  const [contractSourceError, setContractSourceError] = useState("");
  const [contractSourceChainId, setContractSourceChainId] = useState("1979");
  const [contractRisk, setContractRisk] = useState<ContractRiskResponse | null>(null);
  const [contractRiskLoading, setContractRiskLoading] = useState(false);
  const [contractRiskError, setContractRiskError] = useState("");
  const [error, setError] = useState("");

  const activeDomain = useMemo(() => getTrustDomain(domain), [domain]);

  const updateSubject = (value: string) => {
    setSubject(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
    setContractSource(null);
    setContractSourceError("");
    setContractRisk(null);
    setContractRiskError("");
    setError("");
  };

  const updateDomain = (value: string) => {
    setDomain(value);
    setResult(null);
    setAddressActivity(null);
    setAddressActivityError("");
    setContractRisk(null);
    setContractRiskError("");
    setError("");
  };

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: Health) => setHealth(data))
      .catch(() => undefined);
  }, []);

  const loadContractSource = async (address: string, chainId = contractSourceChainId, lookupSource = false) => {
    if (lookupSource) {
      setContractSourceLookupLoading(true);
    } else {
      setContractSourceLoading(true);
    }
    setContractSourceError("");
    if (!lookupSource) setContractSource(null);
    setContractRisk(null);
    setContractRiskError("");

    try {
      const response = await fetch("/api/contract-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chainId, lookupSource }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Contract bytecode check failed");
      setContractSource(data as ContractSourceResponse);
    } catch (contractError) {
      setContractSource(null);
      setContractSourceError(contractError instanceof Error ? contractError.message : "Contract bytecode check failed");
    } finally {
      setContractSourceLoading(false);
      setContractSourceLookupLoading(false);
    }
  };

  const updateContractSourceNetwork = (chainId: string) => {
    setContractSourceChainId(chainId);
    setContractRisk(null);
    setContractRiskError("");
    if (result?.subject) {
      void loadContractSource(result.subject, chainId, false);
    }
  };

  const runVerifiedContractRiskCheck = async () => {
    if (!contractSource?.isContract) return;
    if (!contractSource.verified || !contractSource.sourceCode) {
      setContractRiskError(contractSource.error || "Contract source is not verified. Paste Solidity code manually.");
      return;
    }

    setContractRiskLoading(true);
    setContractRiskError("");
    setContractRisk(null);

    try {
      let walletAddress = connectedWallet;
      if (!isConnected || !walletAddress) {
        const connected = await connectAsync({ connector: injected() });
        walletAddress = connected.accounts?.[0];
      }
      if (!walletAddress) throw new Error("Connect wallet to sign the risk check request.");

      const normalizedWallet = getAddress(walletAddress);
      const timestamp = new Date().toISOString();
      const nonce = makeNonce();
      const signedMessage = buildRiskReviewMessage(normalizedWallet, timestamp, nonce);
      const signature = await signMessageAsync({ message: signedMessage });

      const response = await fetch("/api/risk-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractCode: contractSource.sourceCode,
          contractName: contractSource.contractName,
          walletAddress: normalizedWallet,
          signature,
          signedMessage,
          nonce,
          timestamp,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Contract risk check failed");
      setContractRisk(data as ContractRiskResponse);
    } catch (riskError) {
      setContractRiskError(riskError instanceof Error ? riskError.message : "Contract risk check failed");
    } finally {
      setContractRiskLoading(false);
    }
  };

  const readRegistry = async (clearResult = true) => {
    setLoading(true);
    setError("");
    if (clearResult) {
      setResult(null);
      setAddressActivity(null);
      setAddressActivityError("");
      setContractSource(null);
      setContractSourceError("");
      setContractRisk(null);
      setContractRiskError("");
    }

    try {
      const response = await fetch("/api/verdict/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, domain, action: activeDomain.action }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Trust check failed");
      setResult(data as TrustResult);
      void loadContractSource(data.subject || subject);
      setAddressActivityLoading(true);
      setAddressActivityError("");
      try {
        const activityResponse = await fetch(`/api/address-activity?address=${encodeURIComponent(data.subject || subject)}`);
        const activityData = await activityResponse.json();
        if (!activityResponse.ok || activityData.error) throw new Error(activityData.error || "Activity summary unavailable");
        setAddressActivity(activityData as AddressActivitySummary);
      } catch (activityError) {
        setAddressActivity(null);
        setAddressActivityError(activityError instanceof Error ? activityError.message : "Activity summary unavailable");
      } finally {
        setAddressActivityLoading(false);
      }
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Trust check failed");
      setAddressActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const checkTrust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await readRegistry(true);
  };

  const block = health?.block ? health.block.toLocaleString() : "syncing";
  const registry = health?.contracts?.registry || "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";
  const resultStatus = result?.verdict.value || "UNSEEN";
  const receiptGateLabel = (() => {
    if (!result) return "Check trust first";
    if (loading) return "Re-checking registry";
    if (!result.verdict.hasRecord) return "Registry record required";
    return "";
  })();
  const canMintReceipt = Boolean(result) && !receiptGateLabel;
  const activeContractNetwork = contractSourceNetworks.find((network) => network.value === contractSourceChainId) || contractSourceNetworks[0];
  const verifiedSourceStatus = (() => {
    if (contractSourceLookupLoading) return "Checking...";
    if (!contractSource?.isContract) return "";
    if (contractSource.verified) return "Verified source found";
    if (contractSource.sourceStatus === "not_checked") return "Not checked yet";
    return "Verified source not found";
  })();
  const addressTypeTitle = (() => {
    if (contractSourceLoading) return "Checking address type...";
    if (contractSourceError) return "Address type unavailable";
    if (contractSource?.isContract) return "Smart contract detected";
    if (contractSource) return "Wallet detected";
    return "Checking address type...";
  })();
  const addressTypeDescription = (() => {
    if (contractSourceLoading) return "Omen is checking this address for deployed contract bytecode.";
    if (contractSourceError) return contractSourceError;
    if (contractSource?.isContract) return "This address has contract bytecode.";
    if (contractSource) return "This is a normal wallet address, not a smart contract.";
    return "Omen is checking this address for deployed contract bytecode.";
  })();
  const isContractScan = contractSource?.isContract === true;
  const scanContextTitle = (() => {
    if (isContractScan) {
      if (contractSourceLookupLoading) return "Looking for verified source...";
      if (contractSource?.verified) return "Verified source found";
      if (contractSource?.sourceStatus === "not_checked") return "Not checked yet";
      if (contractSourceError || contractSource?.error?.toLowerCase().includes("not available")) return "Source lookup unavailable";
      return "Verified source not found";
    }
    if (addressActivityLoading) return "Reading Ritual activity...";
    if (addressActivity) {
      const count = addressActivity.outgoingTxCount.toLocaleString();
      return `${count} outgoing transaction${addressActivity.outgoingTxCount === 1 ? "" : "s"}`;
    }
    return "Activity not available";
  })();
  const scanContextDescription = (() => {
    if (isContractScan) {
      if (contractSource?.verified) return "Omen can run a code-level risk check.";
      if (contractSource?.sourceStatus === "not_checked") return "Find verified source or paste Solidity manually to run the checker.";
      return "Paste Solidity manually to run the checker.";
    }
    if (addressActivity) return "Read from Ritual RPC.";
    return addressActivityError || "Ritual activity could not be read for this address.";
  })();
  const scanRecommendedAction = (() => {
    if (contractSourceLoading) return "Complete address scan";
    if (isContractScan) {
      if (contractSource?.verified) return "Run risk check";
      if (contractSource?.sourceStatus === "not_checked") return "Find verified source";
      return "Paste Solidity Manually";
    }
    if (result?.verdict.hasRecord && (resultStatus === "LAPSED" || !result.verdict.isFresh)) return "Refresh or mint receipt";
    if (result?.verdict.hasRecord) return "Mint receipt";
    if ((addressActivity?.outgoingTxCount || 0) > 0) return "Create Omen check";
    return "Check another address";
  })();
  const scanRecommendedDescription = (() => {
    if (contractSourceLoading) return "Omen is still determining whether this address is a wallet or contract.";
    if (isContractScan) {
      if (contractSource?.verified) return "Check contract risk before users or agents interact with it.";
      if (contractSource?.sourceStatus === "not_checked") return "Look for readable Solidity source before running a code-level risk check.";
      return "Omen needs readable Solidity source for a code-level risk check.";
    }
    if (result?.verdict.hasRecord && (resultStatus === "LAPSED" || !result.verdict.isFresh)) {
      return "This wallet has an older Omen check. Refresh for a newer result, or mint a receipt of the current state.";
    }
    if (result?.verdict.hasRecord) return "Save a receipt of the current Omen check.";
    if ((addressActivity?.outgoingTxCount || 0) > 0) {
      return "This wallet has Ritual activity but no Omen check yet. Create one before minting a receipt.";
    }
    return "No Ritual activity or Omen check was found for this wallet.";
  })();

  return (
    <main className="trust-home">
      <section className="trust-shell">
        <div className="trust-hero-panel">
          <div className="trust-hero-copy">
            <p className="mono-kicker">
              <span className={health?.status === "ok" ? "live-dot online" : "live-dot"} />
              OmenRegistry · Ritual · block {block}
            </p>
            <h1>Check before acting.</h1>
            <p>
              Omen scans wallets and smart contracts before users or agents interact with them.
            </p>
          </div>

          <form className="trust-check-card" onSubmit={checkTrust}>
            <div className="field-row">
              <label htmlFor="subject">Address to scan</label>
              <input
                id="subject"
                value={subject}
                onChange={(event) => updateSubject(event.target.value)}
                placeholder="0x... wallet, agent, contract, or autonomous system"
                spellCheck={false}
              />
              <p className="field-hint">Paste a wallet or smart contract address.</p>
            </div>
            <div className="field-grid">
              <div className="field-row">
                <label htmlFor="domain">Trust Domain</label>
                <select id="domain" value={domain} onChange={(event) => updateDomain(event.target.value)}>
                  {trustDomains.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="trust-submit" type="submit" disabled={loading}>
                {loading ? <RefreshCw size={18} className="spin-icon" /> : <Search size={18} />}
                {loading ? "Scanning" : "Run Scan"}
              </button>
            </div>
            <div className="source-strip">
              <Database size={15} />
              OmenRegistry + Ritual RPC
              <span>{shortAddress(registry)}</span>
            </div>
          </form>
        </div>
        {error && (
          <div className="trust-error" role="alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {result && (
          <section className={`result-card omen-address-scan ${statusClass[resultStatus] || "unseen"}`}>
            <div className="panel-heading">
              <span>Pre-Action Scan</span>
              <ShieldCheck size={19} />
            </div>
            <div className="omen-scan-grid">
              <article className="omen-scan-item">
                <span className="omen-scan-step">1 · Address Type</span>
                <h2>{addressTypeTitle}</h2>
                <p>{addressTypeDescription}</p>
              </article>

              <article className="omen-scan-item">
                <span className="omen-scan-step">2 · {isContractScan ? "Contract Source" : "Ritual Activity"}</span>
                <h2>{scanContextTitle}</h2>
                <p>{scanContextDescription}</p>
              </article>

              <article className="omen-scan-item omen-scan-recommendation">
                <span className="omen-scan-step">3 · Next Step</span>
                <h2>{scanRecommendedAction}</h2>
                <p>{scanRecommendedDescription}</p>
              </article>
            </div>
            <p className="omen-scan-disclaimer">Omen checks are project-level context, not an official Ritual endorsement.</p>
          </section>
        )}

        {result && contractSource?.isContract && (
          <section className="contract-risk-card">
            <div className="contract-risk-copy">
              <p className="mono-kicker">
                <ShieldAlert size={15} />
                Contract Risk Path
              </p>
              <h2>Review contract risk</h2>
              {contractSource.verified ? (
                <p>
                  This address has contract bytecode. Verified Solidity source was found
                  {contractSource.contractName ? ` for ${contractSource.contractName}` : ""}. Omen can help check contract risk after a wallet signature.
                </p>
              ) : (
                <p>
                  This address has contract bytecode. Omen can help check contract risk if verified source is available, or you can paste Solidity
                  manually.
                </p>
              )}
            </div>

            <div className="contract-source-controls">
              <label className="contract-network-field">
                <span>Network</span>
                <select value={contractSourceChainId} onChange={(event) => updateContractSourceNetwork(event.target.value)}>
                  {contractSourceNetworks.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="contract-source-status">
                <span>Verified source status</span>
                <b>{verifiedSourceStatus}</b>
              </div>
            </div>

            {contractSource.verified && (
              <div className="contract-source-facts">
                <div>
                  <span>Contract name</span>
                  <b>{contractSource.contractName || "Verified contract"}</b>
                </div>
                <div>
                  <span>Compiler</span>
                  <b>{contractSource.compilerVersion || "Unknown"}</b>
                </div>
                <div>
                  <span>Network</span>
                  <b>{contractSource.network || activeContractNetwork.label}</b>
                </div>
                <div>
                  <span>Source type</span>
                  <b>{contractSource.sourceType === "multi-file-json" ? "Multi-file JSON" : "Single file"}</b>
                </div>
              </div>
            )}

            {contractSource.proxy?.isProxy && (
              <div className="contract-risk-note">
                This address may be a proxy. Review the implementation contract source separately
                {contractSource.proxy.implementationAddress ? `: ${contractSource.proxy.implementationAddress}` : "."}
              </div>
            )}

            <div className="contract-risk-actions">
              <button
                className="refresh-button"
                type="button"
                onClick={() => result?.subject && void loadContractSource(result.subject, contractSourceChainId, true)}
                disabled={contractSourceLookupLoading}
              >
                {contractSourceLookupLoading ? <RefreshCw size={18} className="spin-icon" /> : <Search size={18} />}
                {contractSourceLookupLoading ? "Checking source..." : "Find Verified Source"}
              </button>
              <button
                className="trust-submit"
                type="button"
                onClick={() => void runVerifiedContractRiskCheck()}
                disabled={contractRiskLoading || contractSourceLookupLoading || !contractSource.verified}
              >
                {contractRiskLoading ? <RefreshCw size={18} className="spin-icon" /> : <FileCode2 size={18} />}
                {contractRiskLoading ? "Reviewing contract risk..." : "Run Contract Risk Check"}
              </button>
              <a className="refresh-button contract-risk-link" href="/risk-check">
                Paste Solidity Manually <ExternalLink size={14} />
              </a>
            </div>

            {!contractSource.verified && (
              <div className="contract-risk-note">
                {contractSource.sourceStatus === "not_checked"
                  ? "Verified source has not been checked yet. Omen will not run a code-level risk report from bytecode alone."
                  : contractSource.error || "Verified Solidity source was not found for this address. Paste Solidity manually to run the checker."}
              </div>
            )}

            {contractRiskError && (
              <div className="trust-error contract-risk-error" role="alert">
                <AlertTriangle size={18} />
                {contractRiskError}
              </div>
            )}

            {contractRisk && (
              <div className="contract-risk-result">
                <div>
                  <span>Agent Decision</span>
                  <b>{contractRisk.report.agentDecision}</b>
                </div>
                <div>
                  <span>Risk</span>
                  <b>{contractRisk.report.overallRisk}</b>
                </div>
                <div className="contract-risk-wide">
                  <span>Recommended action</span>
                  <b>{contractRisk.report.launchRecommendation}</b>
                </div>
                <div className="contract-risk-wide">
                  <span>Main problems</span>
                  {contractRisk.report.findings.length > 0 ? (
                    <ul>
                      {contractRisk.report.findings.slice(0, 3).map((finding, index) => (
                        <li key={`${finding.title}-${index}`}>{finding.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <b>No critical/high issue detected by this review.</b>
                  )}
                </div>
                <details className="contract-risk-wide contract-risk-details">
                  <summary>Technical Details</summary>
                  <pre>{JSON.stringify(contractRisk.report, null, 2)}</pre>
                </details>
              </div>
            )}
          </section>
        )}

        {result?.verdict.hasRecord && (
          <TrustReceiptMinter
            key={`${result.subject}:${result.domain}:${result.verdict.value}:${result.verdict.timestamp}:${result.verdict.isFresh}`}
            result={result}
            canMint={canMintReceipt}
            gateLabel={receiptGateLabel}
            isRechecking={loading}
            onRecheck={() => readRegistry(false)}
            outgoingTxCount={addressActivity?.outgoingTxCount}
          />
        )}

      </section>
    </main>
  );
}
