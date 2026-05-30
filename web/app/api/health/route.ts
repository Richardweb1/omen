import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function GET() {
  let block = null;
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org"
    );
    block = await provider.getBlockNumber();
  } catch {}

  return NextResponse.json({
    status: "ok",
    connected: true,
    network: "ritual",
    chainId: 1979,
    block,
    contracts: {
      judgment: process.env.OMEN_JUDGMENT_ADDRESS,
      registry: process.env.OMEN_REGISTRY_ADDRESS,
      agentAware: process.env.OMEN_AGENT_AWARE_ADDRESS,
      agentDirect: process.env.OMEN_AGENT_DIRECT_ADDRESS,
    },
  });
}