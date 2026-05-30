import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    subjects: [
      {
        address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
        label: "Clean Trade Subject",
        domain: "counterparty_trust.ritual_trade_v1",
        action: "trade",
        expected: "SEALED",
        description: "Primary clean counterparty benchmark",
      },
      {
        address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c",
        label: "Risky Trade Subject",
        domain: "counterparty_trust.ritual_trade_v1",
        action: "trade",
        expected: "REVOKED",
        description: "Primary risky counterparty benchmark",
      },
      {
        address: "0x0000000000000000000000000000000000000b0b",
        label: "Agent Safety Subject",
        domain: "agent_safety.ritual_infernet_v1",
        action: "execute",
        expected: "SEALED",
        description: "Dedicated agent safety benchmark",
      },
    ],
  });
}
