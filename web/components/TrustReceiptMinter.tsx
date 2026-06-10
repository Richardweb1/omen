"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, useSendTransaction, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { decodeEventLog, encodeFunctionData, type Hex } from "viem";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { RITUAL_CHAIN_ID, ritualExplorerAddress, ritualExplorerTx, TRUST_RECEIPT_ABI, TRUST_RECEIPT_ADDRESS } from "@/lib/contracts";
import TrustReceiptGiftCard from "@/components/TrustReceiptGiftCard";

type TrustReceiptResult = {
  subject: string;
  domain: string;
  source: "OmenRegistry";
  registry: string;
  verdict: {
    value: string;
    timestamp: number;
    isFresh: boolean;
    hasRecord: boolean;
  };
};

type ReceiptStatus =
  | "idle"
  | "connecting"
  | "switching"
  | "requesting"
  | "submitted"
  | "confirming"
  | "minted"
  | "failed";

type RpcReceipt = {
  status?: string;
  logs?: Array<{
    address: string;
    topics: Hex[];
    data: Hex;
  }>;
};

type TrustReceiptMinterProps = {
  result: TrustReceiptResult;
  canMint: boolean;
  gateLabel: string;
  isRechecking?: boolean;
  onRecheck?: () => Promise<void> | void;
  onMintStateChange?: (state: { status: ReceiptStatus; txHash: string; tokenId: string }) => void;
  outgoingTxCount?: number;
};

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

    const receipt = await rpcCall<RpcReceipt>("eth_getTransactionReceipt", [hash]);
    if (receipt?.status === "0x1") return receipt;
    if (receipt?.status === "0x0") throw new Error("Mint transaction failed on Ritual");
  }

  if (!seenOnRitual) {
    throw new Error("Transaction hash was not found on Ritual. Switch your wallet to Ritual Chain and submit again.");
  }

  throw new Error("Mint transaction timed out");
}

function extractTokenId(receipt: RpcReceipt | null) {
  const logs = receipt?.logs || [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== TRUST_RECEIPT_ADDRESS.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: TRUST_RECEIPT_ABI,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      if (decoded.eventName === "TrustReceiptMinted") {
        return decoded.args.tokenId.toString();
      }
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }
  return "";
}

export default function TrustReceiptMinter({
  result,
  canMint,
  gateLabel,
  isRechecking = false,
  onRecheck,
  onMintStateChange,
  outgoingTxCount,
}: TrustReceiptMinterProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<ReceiptStatus>("idle");
  const [txHash, setTxHash] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [error, setError] = useState("");

  const hasReceiptAddress = Boolean(TRUST_RECEIPT_ADDRESS);
  const canMintRecord = result.source === "OmenRegistry" && result.verdict.hasRecord && hasReceiptAddress && canMint;
  const isBusy = status === "connecting" || status === "switching" || status === "requesting" || status === "submitted" || status === "confirming";
  const stale = !result.verdict.isFresh;
  const cardClassName = canMintRecord ? "receipt-card" : "receipt-card receipt-card-disabled";
  const hasMintImageData = Boolean(txHash);
  const blockerMessages = [
    !hasReceiptAddress ? "Receipt contract missing" : "",
    !result.verdict.hasRecord ? "Registry record required" : "",
    hasReceiptAddress && result.verdict.hasRecord && !isConnected ? "Wallet not connected" : "",
    hasReceiptAddress && result.verdict.hasRecord && isConnected && chainId !== RITUAL_CHAIN_ID ? "Wrong network" : "",
    status === "failed" ? "Mint transaction failed" : "",
    status === "minted" && !tokenId ? "Mint succeeded but token ID could not be decoded" : "",
  ].filter(Boolean);

  useEffect(() => {
    onMintStateChange?.({ status, txHash, tokenId });
  }, [onMintStateChange, status, tokenId, txHash]);

  const statusLabel = (() => {
    if (!hasReceiptAddress) return "Receipt contract unavailable";
    if (gateLabel) return gateLabel;
    if (!result.verdict.hasRecord) return "Registry record required";
    if (!isConnected) return "Connect wallet";
    if (chainId !== RITUAL_CHAIN_ID) return "Switch to Ritual";
    if (status === "connecting") return "Connect wallet";
    if (status === "switching") return "Switch to Ritual";
    if (status === "requesting") return "Requesting wallet signature";
    if (status === "submitted") return "Transaction submitted";
    if (status === "confirming") return "Confirming on Ritual";
    if (status === "minted") return "Receipt minted";
    if (status === "failed") return "Mint failed";
    return "Ready to mint";
  })();

  const buttonLabel = (() => {
    if (!hasReceiptAddress) return "Receipt contract unavailable";
    if (gateLabel) return gateLabel;
    if (!result.verdict.hasRecord) return "Registry record required";
    if (!isConnected) return "Connect wallet";
    if (chainId !== RITUAL_CHAIN_ID) return "Switch to Ritual";
    if (status === "requesting") return "Requesting wallet signature";
    if (status === "submitted") return "Transaction submitted";
    if (status === "confirming") return "Confirming on Ritual";
    if (status === "minted") return "Receipt minted";
    if (status === "failed") return "Mint failed";
    return "Mint Trust Receipt";
  })();

  const mintReceipt = async () => {
    setError("");
    setTokenId("");

    if (!canMintRecord) {
      setError(gateLabel || (hasReceiptAddress ? "A registry-backed record is required before minting." : "Receipt contract address is not configured."));
      return;
    }

    try {
      if (!isConnected) {
        setStatus("connecting");
        await connectAsync({ connector: injected() });
      }

      if (chainId !== RITUAL_CHAIN_ID) {
        setStatus("switching");
        await switchChainAsync({ chainId: RITUAL_CHAIN_ID });
      }

      setStatus("requesting");
      const data = encodeFunctionData({
        abi: TRUST_RECEIPT_ABI,
        functionName: "mint",
        args: [result.subject as `0x${string}`, result.domain],
      });
      const hash = await sendTransactionAsync({ to: TRUST_RECEIPT_ADDRESS as `0x${string}`, data, gas: BigInt(1_500_000) });
      setTxHash(hash);

      setStatus("submitted");
      setStatus("confirming");
      const receipt = await waitForReceipt(hash);
      setTokenId(extractTokenId(receipt));
      setStatus("minted");
    } catch (mintError) {
      setStatus("failed");
      const message = mintError instanceof Error ? mintError.message : "Mint failed";
      setError(message.includes("User rejected") || message.includes("user rejected") ? "Mint rejected in wallet." : message.slice(0, 180));
    }
  };

  return (
    <section className={cardClassName}>
      <div>
        <p className="mono-kicker">Final Step</p>
        <h2>Mint Trust Receipt</h2>
        <p>After OmenRegistry is read, mint a wallet-signed receipt for this trust check.</p>
        <p className="receipt-helper">
          The receipt is a record of the completed workflow. The active trust state remains the OmenRegistry result. Confirmed onchain records cannot be deleted.
        </p>
        {!stale && <p className="receipt-fresh-note">Fresh at mint: Yes</p>}
        {stale && <p className="receipt-warning">Fresh at mint: No. This receipt will mint a historical snapshot of the current registry record.</p>}
      </div>

      <div className="receipt-action-panel">
        <div className="receipt-facts">
          <div>
            <span>Subject</span>
            <a href={ritualExplorerAddress(result.subject)} target="_blank" rel="noreferrer">
              {result.subject.slice(0, 10)}...{result.subject.slice(-6)}
            </a>
          </div>
          <div>
            <span>Trust Status</span>
            <b>{result.verdict.value}</b>
          </div>
          <div>
            <span>Fresh at Mint</span>
            <b>{result.verdict.isFresh ? "Yes" : "No"}</b>
          </div>
          <div>
            <span>Source</span>
            <a href={ritualExplorerAddress(result.registry)} target="_blank" rel="noreferrer">
              OmenRegistry
            </a>
          </div>
        </div>

        <div className="receipt-status-line">
          <span>Status</span>
          <b>{statusLabel}</b>
        </div>

        {TRUST_RECEIPT_ADDRESS && (
          <a className="receipt-link muted" href={ritualExplorerAddress(TRUST_RECEIPT_ADDRESS)} target="_blank" rel="noreferrer">
            View Receipt Contract <ExternalLink size={14} />
          </a>
        )}

        <div className="receipt-action-buttons">
          <button className="refresh-button" type="button" onClick={() => void onRecheck?.()} disabled={isBusy || isRechecking}>
            <RefreshCw size={16} className={isRechecking ? "spin-icon" : ""} />
            Re-check Registry
          </button>
          <button className="trust-submit receipt-mint-button" type="button" onClick={() => void mintReceipt()} disabled={isBusy || !canMintRecord || status === "minted"}>
            {isBusy ? <RefreshCw size={17} className="spin-icon" /> : <ArrowRight size={17} />}
            {buttonLabel}
          </button>
        </div>

        {blockerMessages.length > 0 && (
          <div className="receipt-debug-list">
            <span>Why this step is locked</span>
            {blockerMessages.map((message) => (
              <b key={message}>{message}</b>
            ))}
          </div>
        )}

        {status === "minted" && (
          <div className="receipt-success">
            <strong>Receipt minted</strong>
            {tokenId && (
              <p>
                Token ID: <b>#{tokenId}</b>
              </p>
            )}
            {!tokenId && <p>Token ID: pending/unknown</p>}
            {txHash && (
              <p>
                Transaction: <code>{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
              </p>
            )}
            {txHash && (
              <a className="receipt-link" href={ritualExplorerTx(txHash)} target="_blank" rel="noreferrer">
                View on Ritual Explorer <ExternalLink size={14} />
              </a>
            )}
            <p className="receipt-helper">This receipt is a historical snapshot. Re-check OmenRegistry before acting.</p>
          </div>
        )}

        {txHash && status !== "minted" && (
          <a className="receipt-link" href={ritualExplorerTx(txHash)} target="_blank" rel="noreferrer">
            View Mint Transaction <ExternalLink size={14} />
          </a>
        )}

        {error && <div className="trust-error receipt-error">{error}</div>}
      </div>
      {status === "minted" && hasMintImageData ? (
        <TrustReceiptGiftCard
          tokenId={tokenId}
          txHash={txHash}
          explorerLink={ritualExplorerTx(txHash)}
          status={result.verdict.value}
          subject={result.subject}
          domain={result.domain}
          freshAtMint={result.verdict.isFresh}
          outgoingTxCount={outgoingTxCount}
        />
      ) : status === "minted" ? (
        <section className="receipt-gift-panel">
          <div className="receipt-gift-copy">
            <p className="mono-kicker">Commemorative image</p>
            <h3>Receipt minted</h3>
            <p>Receipt minted, but image preview could not be generated. Try Download Image again.</p>
            <p className="receipt-helper">This receipt is a historical snapshot. Re-check OmenRegistry before acting.</p>
          </div>
          <div className="receipt-gift-preview">
            <div className="receipt-gift-fallback" role="status">
              Receipt minted, but image preview could not be generated. Try Download Image again.
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
