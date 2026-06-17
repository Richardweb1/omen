import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { RITUAL_CHAIN_ID } from "@/lib/contracts";

const RITUAL_PUBLIC_RPC_URL = "https://rpc.ritualfoundation.org";
const RITUAL_EXPLORER_URL = "https://explorer.ritualfoundation.org";
const ETHERSCAN_V2_API_URL = "https://api.etherscan.io/v2/api";

type RpcResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

type SourceType = "single-file" | "multi-file-json";

type ExplorerSourceItem = {
  ContractName?: string;
  CompilerVersion?: string;
  SourceCode?: string;
  Proxy?: string;
  Implementation?: string;
};

type ExplorerResponse = {
  status?: string;
  message?: string;
  result?: ExplorerSourceItem[] | string;
};

type SupportedNetwork = {
  chainId: string;
  network: string;
  explorer: string;
  rpcUrl: string | undefined;
  v1ApiUrl?: string;
  keyEnv?: string;
  supportsVerifiedSource: boolean;
};

const NETWORKS: Record<string, SupportedNetwork> = {
  [String(RITUAL_CHAIN_ID)]: {
    chainId: String(RITUAL_CHAIN_ID),
    network: "Ritual Chain",
    explorer: RITUAL_EXPLORER_URL,
    rpcUrl: process.env.RITUAL_RPC_URL || RITUAL_PUBLIC_RPC_URL,
    supportsVerifiedSource: false,
  },
  "1": {
    chainId: "1",
    network: "Ethereum Mainnet",
    explorer: "https://etherscan.io",
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
    v1ApiUrl: "https://api.etherscan.io/api",
    keyEnv: "ETHERSCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "11155111": {
    chainId: "11155111",
    network: "Sepolia",
    explorer: "https://sepolia.etherscan.io",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    v1ApiUrl: "https://api-sepolia.etherscan.io/api",
    keyEnv: "ETHERSCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "8453": {
    chainId: "8453",
    network: "Base",
    explorer: "https://basescan.org",
    rpcUrl: process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com",
    v1ApiUrl: "https://api.basescan.org/api",
    keyEnv: "BASESCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "42161": {
    chainId: "42161",
    network: "Arbitrum",
    explorer: "https://arbiscan.io",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arbitrum-one-rpc.publicnode.com",
    v1ApiUrl: "https://api.arbiscan.io/api",
    keyEnv: "ARBISCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "10": {
    chainId: "10",
    network: "Optimism",
    explorer: "https://optimistic.etherscan.io",
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://optimism-rpc.publicnode.com",
    v1ApiUrl: "https://api-optimistic.etherscan.io/api",
    keyEnv: "OPTIMISTIC_ETHERSCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "137": {
    chainId: "137",
    network: "Polygon",
    explorer: "https://polygonscan.com",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com",
    v1ApiUrl: "https://api.polygonscan.com/api",
    keyEnv: "POLYGONSCAN_API_KEY",
    supportsVerifiedSource: true,
  },
  "56": {
    chainId: "56",
    network: "BSC",
    explorer: "https://bscscan.com",
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-rpc.publicnode.com",
    v1ApiUrl: "https://api.bscscan.com/api",
    keyEnv: "BSCSCAN_API_KEY",
    supportsVerifiedSource: true,
  },
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

async function readBytecode(address: string, network: SupportedNetwork) {
  if (!network.rpcUrl) {
    return { code: "", error: "RPC is not configured for this network." };
  }

  const response = await fetch(network.rpcUrl, {
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

function parseSourceCode(rawSource: string) {
  const trimmed = rawSource.trim();
  if (!trimmed || trimmed === "0x") return null;

  const jsonCandidate = trimmed.startsWith("{{") && trimmed.endsWith("}}") ? trimmed.slice(1, -1) : trimmed;

  if (jsonCandidate.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonCandidate) as {
        sources?: Record<string, { content?: string } | string>;
      };

      if (parsed.sources && typeof parsed.sources === "object") {
        const files = Object.entries(parsed.sources)
          .map(([path, source]) => {
            const content = typeof source === "string" ? source : source?.content || "";
            return content ? `// File: ${path}\n${content}` : "";
          })
          .filter(Boolean);

        if (files.length > 0) {
          return {
            sourceCode: files.join("\n\n"),
            sourceType: "multi-file-json" as SourceType,
          };
        }
      }
    } catch {
      // Some explorers return Solidity that starts with braces in comments; treat it as single-file below.
    }
  }

  return {
    sourceCode: trimmed,
    sourceType: "single-file" as SourceType,
  };
}

function getExplorerKey(network: SupportedNetwork) {
  if (process.env.ETHERSCAN_API_KEY) {
    return {
      apiKey: process.env.ETHERSCAN_API_KEY,
      apiUrl: ETHERSCAN_V2_API_URL,
      useV2: true,
    };
  }

  const chainSpecificKey = network.keyEnv ? process.env[network.keyEnv] : "";
  if (chainSpecificKey && network.v1ApiUrl) {
    return {
      apiKey: chainSpecificKey,
      apiUrl: network.v1ApiUrl,
      useV2: false,
    };
  }

  return null;
}

function buildNotFoundResponse(address: string, network: SupportedNetwork, message?: string, proxy?: { isProxy: boolean; implementationAddress?: string }) {
  return {
    verified: false,
    address,
    chainId: network.chainId,
    network: network.network,
    error: message || "Verified Solidity source was not found for this address. Paste Solidity manually to run the checker.",
    explorer: network.explorer,
    proxy,
  };
}

async function fetchVerifiedSource(address: string, network: SupportedNetwork) {
  if (!network.supportsVerifiedSource) {
    return buildNotFoundResponse(
      address,
      network,
      "Contract detected on Ritual Chain, but verified Solidity source lookup is not available yet. Paste Solidity manually.",
    );
  }

  const explorerKey = getExplorerKey(network);
  if (!explorerKey) {
    return buildNotFoundResponse(
      address,
      network,
      "Explorer API key is not configured for this network. Paste Solidity manually to run the checker.",
    );
  }

  const url = new URL(explorerKey.apiUrl);
  if (explorerKey.useV2) url.searchParams.set("chainid", network.chainId);
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", address);
  url.searchParams.set("apikey", explorerKey.apiKey);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as ExplorerResponse;
  const item = Array.isArray(data.result) ? data.result[0] : null;
  const implementationAddress = item?.Implementation && isAddress(item.Implementation) ? getAddress(item.Implementation) : undefined;
  const proxy = item?.Proxy === "1" ? { isProxy: true, implementationAddress } : undefined;
  const parsedSource = parseSourceCode(item?.SourceCode || "");

  if (!response.ok || data.status !== "1" || !item || !parsedSource) {
    return buildNotFoundResponse(address, network, undefined, proxy);
  }

  return {
    verified: true,
    address,
    chainId: network.chainId,
    network: network.network,
    contractName: item.ContractName || "Verified contract",
    compilerVersion: item.CompilerVersion || "Unknown",
    sourceCode: parsedSource.sourceCode,
    sourceType: parsedSource.sourceType,
    explorer: network.explorer,
    proxy,
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
  const lookupSource = asBoolean(input.lookupSource);
  const network = NETWORKS[chainId];

  if (!addressInput) return NextResponse.json({ error: "address is required." }, { status: 400 });
  if (!isAddress(addressInput)) return NextResponse.json({ error: "address must be a valid EVM address." }, { status: 400 });
  if (!network) return NextResponse.json({ error: "Unsupported network for contract source lookup." }, { status: 400 });

  const address = getAddress(addressInput);
  const { code, error } = await readBytecode(address, network);
  if (error) {
    return NextResponse.json({ address, chainId, network: network.network, isContract: false, verified: false, error }, { status: 502 });
  }

  const isContract = Boolean(code && code !== "0x");
  if (!isContract) {
    return NextResponse.json({
      address,
      chainId,
      network: network.network,
      isContract: false,
      verified: false,
      error: "No contract bytecode found for this address.",
      explorer: network.explorer,
    });
  }

  if (!lookupSource) {
    return NextResponse.json({
      address,
      chainId,
      network: network.network,
      isContract: true,
      verified: false,
      sourceStatus: "not_checked",
      error: "Verified source lookup has not been run yet.",
      explorer: network.explorer,
    });
  }

  const source = await fetchVerifiedSource(address, network);
  return NextResponse.json({
    isContract: true,
    ...source,
  });
}
