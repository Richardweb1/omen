import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deep audit is disabled. Omen write actions must be signed by the connected wallet, with no backend signer.",
    },
    { status: 410 },
  );
}
