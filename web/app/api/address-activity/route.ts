import { NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";

type RpcResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

async function rpcCall(method: string, params: unknown[]) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });

  return (await response.json()) as RpcResponse;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address") || "";

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  if (!ethers.isAddress(address)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  try {
    const txCountResponse = await rpcCall("eth_getTransactionCount", [address, "latest"]);
    if (txCountResponse.error) {
      throw new Error(txCountResponse.error.message || "transaction count lookup failed");
    }

    const outgoingTxCount = Number.parseInt(txCountResponse.result || "0x0", 16);

    return NextResponse.json({
      address,
      outgoingTxCount,
      txCountSource: "eth_getTransactionCount",
      txCountLabel: "Outgoing transactions",
      reliability: "RPC nonce count only; does not include incoming transfers.",
      stakeActivity: "Not verified",
      donationActivity: "Not verified",
      swapActivity: "Not verified",
      notes: "Stake, donation, and swap activity require known contracts/events or an external indexer.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "address activity lookup failed";
    return NextResponse.json({ error: message.slice(0, 180) }, { status: 500 });
  }
}
