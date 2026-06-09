import { NextResponse } from "next/server";
import { createPublicClient, defineChain, http } from "viem";

const ritualChain = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } },
});

const client = createPublicClient({
  chain: ritualChain,
  transport: http("https://rpc.ritualfoundation.org"),
});

export async function GET() {
  try {
    const block = await client.getBlockNumber();
    return NextResponse.json({ block: Number(block) });
  } catch (e) {
    return NextResponse.json({ block: null, error: e instanceof Error ? e.message : "Block lookup failed" }, { status: 500 });
  }
}
