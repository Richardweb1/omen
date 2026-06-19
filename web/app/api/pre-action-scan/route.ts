import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { normalizeScanChain, runPreActionScan } from "@/lib/preActionScan";

const MAX_CONTEXT_LENGTH = 240;

function extensionOrigins() {
  return String(process.env.OMEN_EXTENSION_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  if (origin === new URL(req.url).origin) return origin;
  return extensionOrigins().includes(origin) ? origin : false;
}

function responseHeaders(origin: string | null) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  };
}

export async function OPTIONS(req: Request) {
  const origin = corsOrigin(req);
  if (origin === false) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...responseHeaders(origin),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    },
  });
}

export async function POST(req: Request) {
  const origin = corsOrigin(req);
  if (origin === false) {
    return NextResponse.json(
      { error: { code: "ORIGIN_NOT_ALLOWED", message: "This origin is not allowed to use the extension scan API." } },
      { status: 403, headers: responseHeaders(null) },
    );
  }

  // TODO(extension): add a durable per-origin and per-IP rate limiter before public extension rollout.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400, headers: responseHeaders(origin) },
    );
  }

  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const address = typeof input.address === "string" ? input.address.trim() : "";
  const chain = normalizeScanChain(input.chainId ?? input.chain ?? input.network);
  const appContext = typeof input.appContext === "string" ? input.appContext.trim() : "";
  const declaredOrigin = typeof input.origin === "string" ? input.origin.trim() : "";

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: { code: "INVALID_ADDRESS", message: "address must be a valid EVM address." } },
      { status: 400, headers: responseHeaders(origin) },
    );
  }
  if (chain === null) {
    return NextResponse.json(
      { error: { code: "UNSUPPORTED_NETWORK", message: "Pre-Action Scan currently supports Ritual Chain only." } },
      { status: 400, headers: responseHeaders(origin) },
    );
  }
  if (appContext.length > MAX_CONTEXT_LENGTH || declaredOrigin.length > MAX_CONTEXT_LENGTH) {
    return NextResponse.json(
      { error: { code: "CONTEXT_TOO_LARGE", message: `origin and appContext must be ${MAX_CONTEXT_LENGTH} characters or fewer.` } },
      { status: 400, headers: responseHeaders(origin) },
    );
  }

  try {
    const scan = await runPreActionScan(address);
    return NextResponse.json(scan, { headers: responseHeaders(origin) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pre-Action Scan failed.";
    return NextResponse.json(
      { error: { code: "SCAN_UNAVAILABLE", message: message.slice(0, 200) } },
      { status: 502, headers: responseHeaders(origin) },
    );
  }
}
