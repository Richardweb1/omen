"use client";

import { useState } from "react";
import { useAccount, useChainId, useConnect, useSendTransaction, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { decodeEventLog, encodeFunctionData, type Hex } from "viem";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { RITUAL_CHAIN_ID, ritualExplorerAddress, ritualExplorerTx, TRUST_RECEIPT_ABI, TRUST_RECEIPT_ADDRESS } from "@/lib/contracts";

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

export default function TrustReceiptMinter({ result }: TrustReceiptMinterProps) {
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
  const canMintRecord = result.source === "OmenRegistry" && result.verdict.hasRecord && hasReceiptAddress;
  const isBusy = status === "connecting" || status === "switching" || status === "requesting" || status === "submitted" || status === "confirming";
  const stale = !result.verdict.isFresh;

  const statusLabel = (() => {
    if (!hasReceiptAddress) return "Receipt contract unavailable";
    if (!result.verdict.hasRecord) return "Registry record required";
    if (!isConnected) return "Connect wallet";
    if (chainId !== RITUAL_CHAIN_ID) return "Switch to Ritual 1979";
    if (status === "connecting") return "Connect wallet";
    if (status === "switching") return "Switch to Ritual 1979";
    if (status === "requesting") return "Requesting wallet signature";
    if (status === "submitted") return "Transaction submitted";
    if (status === "confirming") return "Confirming on Ritual";
    if (status === "minted") return "Receipt minted";
    if (status === "failed") return "Mint failed";
    return "Ready to mint";
  })();

  const buttonLabel = (() => {
    if (!hasReceiptAddress) return "Receipt contract unavailable";
    if (!result.verdict.hasRecord) return "Registry result required";
    if (!isConnected) return "Connect wallet";
    if (chainId !== RITUAL_CHAIN_ID) return "Switch to Ritual 1979";
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
      setError(hasReceiptAddress ? "A registry record is required before minting." : "Receipt contract address is not configured.");
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
    <section className="receipt-card">
      <div>
        <p className="mono-kicker">Omen Trust Receipt</p>
        <h2>Mint Trust Receipt</h2>
        <p>Mint a wallet-signed NFT receipt of this registry-backed trust result.</p>
        <p className="receipt-helper">This receipt captures the registry state at mint time. Always re-check OmenRegistry before acting.</p>
        {!stale && <p className="receipt-fresh-note">Fresh at mint: Yes</p>}
        {stale && <p className="receipt-warning">Fresh at mint: No. This receipt records a stale registry result.</p>}
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
            OmenTrustReceipt contract <ExternalLink size={14} />
          </a>
        )}

        <button className="trust-submit receipt-mint-button" type="button" onClick={() => void mintReceipt()} disabled={isBusy || !canMintRecord || status === "minted"}>
          {isBusy ? <RefreshCw size={17} className="spin-icon" /> : <ArrowRight size={17} />}
          {buttonLabel}
        </button>

        {status === "minted" && (
          <div className="receipt-success">
            <strong>Receipt minted</strong>
            {tokenId && (
              <p>
                Token ID: <b>#{tokenId}</b>
              </p>
            )}
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
            View transaction <ExternalLink size={14} />
          </a>
        )}

        {error && <div className="trust-error receipt-error">{error}</div>}
      </div>
    </section>
  );
}
