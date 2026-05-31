import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";

const ritualChain = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } },
};

const client = createPublicClient({
  chain: ritualChain as any,
  transport: http("https://rpc.ritualfoundation.org"),
});

export async function GET() {
  try {
    const block = await client.getBlockNumber();
    return NextResponse.json({ block: Number(block) });
  } catch (e: any) {
    return NextResponse.json({ block: null, error: e.message }, { status: 500 });
  }
}