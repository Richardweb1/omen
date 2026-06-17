import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { RITUAL_CHAIN_ID, RITUAL_EXPLORER_URL, RITUAL_PUBLIC_RPC_URL } from "@/lib/contracts";

type RpcResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

type EtherscanSourceItem = {
  ContractName?: string;
  CompilerVersion?: string;
  SourceCode?: string;
};

type EtherscanResponse = {
  status?: string;
  message?: string;
  result?: EtherscanSourceItem[] | string;
};

const ETHERSCAN_SOURCE_ENDPOINTS: Record<string, { name: string; apiUrl: string; explorer: string }> = {
  "1": {
    name: "Ethereum",
    apiUrl: "https://api.etherscan.io/api",
    explorer: "https://etherscan.io",
  },
  "11155111": {
    name: "Sepolia",
    apiUrl: "https://api-sepolia.etherscan.io/api",
    explorer: "https://sepolia.etherscan.io",
  },
};

const RPC_URLS: Record<string, string | undefined> = {
  [String(RITUAL_CHAIN_ID)]: process.env.RITUAL_RPC_URL || RITUAL_PUBLIC_RPC_URL,
  "1": process.env.ETHEREUM_RPC_URL,
  "11155111": process.env.SEPOLIA_RPC_URL,
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readBytecode(address: string, chainId: string) {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    return { code: "", error: "RPC is not configured for this network." };
  }

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getCode",
      params: [address, "latest"],
    }),
    cache: "no-store",
  });
  const data = (await response.json()) as RpcResponse;
  if (!response.ok || data.error) {
    return { code: "", error: data.error?.message || "Unable to read contract bytecode." };
  }

  return { code: data.result || "0x", error: "" };
}

function normalizeSource(source: string) {
  const trimmed = source.trim();
  if (!trimmed || trimmed === "0x") return "";
  return trimmed;
}

async function fetchVerifiedSource(address: string, chainId: string) {
  const sourceEndpoint = ETHERSCAN_SOURCE_ENDPOINTS[chainId];
  if (!sourceEndpoint) {
    return {
      verified: false,
      error: "Verified source fetch is not available for this network yet. Paste Solidity code manually.",
      explorer: RITUAL_EXPLORER_URL,
    };
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    return {
      verified: false,
      error: "ETHERSCAN_API_KEY is not configured. Paste Solidity code manually.",
      explorer: sourceEndpoint.explorer,
    };
  }

  const url = new URL(sourceEndpoint.apiUrl);
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", address);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as EtherscanResponse;
  const item = Array.isArray(data.result) ? data.result[0] : null;
  const sourceCode = normalizeSource(item?.SourceCode || "");

  if (!response.ok || data.status !== "1" || !item || !sourceCode) {
    return {
      verified: false,
      error: "Contract source is not verified. Paste Solidity code manually.",
      explorer: sourceEndpoint.explorer,
    };
  }

  return {
    verified: true,
    contractName: item.ContractName || "Verified contract",
    compilerVersion: item.CompilerVersion || "Unknown",
    sourceCode,
    explorer: sourceEndpoint.explorer,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const addressInput = asString(input.address);
  const chainId = asString(input.chainId) || String(RITUAL_CHAIN_ID);

  if (!addressInput) return NextResponse.json({ error: "address is required." }, { status: 400 });
  if (!isAddress(addressInput)) return NextResponse.json({ error: "address must be a valid EVM address." }, { status: 400 });

  const address = getAddress(addressInput);
  const { code, error } = await readBytecode(address, chainId);
  if (error) {
    return NextResponse.json({ address, chainId, isContract: false, verified: false, error }, { status: 502 });
  }

  const isContract = Boolean(code && code !== "0x");
  if (!isContract) {
    return NextResponse.json({
      address,
      chainId,
      isContract: false,
      verified: false,
      error: "No contract bytecode found for this address.",
    });
  }

  const source = await fetchVerifiedSource(address, chainId);
  return NextResponse.json({
    address,
    chainId,
    isContract: true,
    ...source,
  });
}
