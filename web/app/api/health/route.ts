import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    connected: true,
    network: "ritual",
    chainId: 1979,
    block: null,
    contracts: {
      judgment: process.env.OMEN_JUDGMENT_ADDRESS,
      registry: process.env.OMEN_REGISTRY_ADDRESS,
      agentAware: process.env.OMEN_AGENT_AWARE_ADDRESS,
      agentDirect: process.env.OMEN_AGENT_DIRECT_ADDRESS,
    },
  });
}