import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getRitualFeeSummary } from "@/lib/ritualFees";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address")?.trim() || "";
  if (!isAddress(address)) {
    return NextResponse.json({ error: "address must be a valid EVM address." }, { status: 400 });
  }
  try {
    return NextResponse.json(await getRitualFeeSummary(address), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ritual fee summary is unavailable." },
      { status: 502 },
    );
  }
}
