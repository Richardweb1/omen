import { createPublicClient, defineChain, getAddress, http, isAddress } from "viem";
import { getRitualFeeSummary } from "@/lib/ritualFees";

export const PRE_ACTION_SCAN_SCHEMA_VERSION = "1.0" as const;
export const DEFAULT_SCAN_DOMAIN = "counterparty_trust.ritual_trade_v1";
const RITUAL_CHAIN_ID = 1979;
const RITUAL_CHAIN_NAME = "Ritual Chain";
const RITUAL_PUBLIC_RPC_URL = "https://rpc.ritualfoundation.org";
const REGISTRY_ADDRESS = "0xCbB34EB8651dc8f1d65a20165C1166C13f626620" as const;
const REGISTRY_READ_ABI = [
  {
    name: "readVerdict",
    type: "function",
    inputs: [
      { name: "subject", type: "address" },
      { name: "domain", type: "string" },
    ],
    outputs: [
      { name: "verdict", type: "uint8" },
      { name: "timestamp", type: "uint256" },
      { name: "isSealed", type: "bool" },
      { name: "isRevoked", type: "bool" },
      { name: "isFresh", type: "bool" },
    ],
    stateMutability: "view",
  },
] as const;

export type PreActionAddressType = "wallet" | "contract" | "unknown";
export type PreActionDecision = "ALLOW" | "REVIEW" | "BLOCK" | "UNKNOWN";
export type PreActionNextStep =
  | "scan_contract_source"
  | "paste_solidity"
  | "refresh_check"
  | "no_action";
export type ContractSourceLookupStatus =
  | "not_applicable"
  | "available"
  | "unavailable_on_ritual"
  | "rpc_unavailable";
export type OmenRegistryStatus = "TRUSTED" | "REVOKED" | "PENDING" | "LAPSED" | "NO_RECORD" | "UNAVAILABLE";

export type PreActionScanResponse = {
  schemaVersion: typeof PRE_ACTION_SCAN_SCHEMA_VERSION;
  address: `0x${string}`;
  chainId: number;
  addressType: PreActionAddressType;
  activity: {
    balanceRit?: string;
    balanceSource: "ritual-rpc" | "unavailable";
    outgoingTxCount?: number;
    totalFeesRit?: string;
    averageFeeRit?: string;
    highestFeeRit?: string;
    source: "ritual-explorer-indexer" | "unavailable";
    coverageComplete?: boolean;
  };
  contract: {
    hasBytecode: boolean | null;
    verifiedSourceAvailable: boolean;
    sourceLookupStatus: ContractSourceLookupStatus;
  };
  omen: {
    registryStatus: OmenRegistryStatus;
  };
  decision: {
    value: PreActionDecision;
    reason: string;
  };
  nextStep: PreActionNextStep;
  warnings: string[];
  metadata: {
    timestamp: string;
    providerUsed: "ritual-rpc";
    extensionReady: true;
  };
};

type RegistryRead = {
  status: OmenRegistryStatus;
  hasRecord: boolean;
  isFresh: boolean;
};

const VERDICT_NAMES = ["NO_RECORD", "TRUSTED", "PENDING", "REVOKED", "LAPSED"] as const;

function registryStatus(verdict: number, timestamp: bigint, isRevoked: boolean, isFresh: boolean): RegistryRead {
  const hasRecord = timestamp > 0n;
  if (!hasRecord) return { status: "NO_RECORD", hasRecord: false, isFresh: false };
  if (isRevoked || verdict === 3) return { status: "REVOKED", hasRecord: true, isFresh };
  if (!isFresh) return { status: "LAPSED", hasRecord: true, isFresh: false };
  const status = VERDICT_NAMES[verdict] || "PENDING";
  return { status: status === "NO_RECORD" ? "PENDING" : status, hasRecord: true, isFresh };
}

function chooseDecision(input: {
  addressType: PreActionAddressType;
  registry: RegistryRead;
  sourceAvailable: boolean;
}) {
  if (input.addressType === "unknown") {
    return {
      decision: { value: "UNKNOWN" as const, reason: "Ritual RPC could not determine whether this address contains contract bytecode." },
      nextStep: "no_action" as const,
    };
  }

  if (input.registry.status === "REVOKED") {
    return {
      decision: { value: "BLOCK" as const, reason: "OmenRegistry contains a revoked project-level signal for this address." },
      nextStep: "no_action" as const,
    };
  }

  if (input.addressType === "contract") {
    return input.sourceAvailable
      ? {
          decision: { value: "REVIEW" as const, reason: "Contract bytecode and verified source are available, but contract risk has not been reviewed." },
          nextStep: "scan_contract_source" as const,
        }
      : {
          decision: { value: "REVIEW" as const, reason: "Contract bytecode was found, but verified source lookup is unavailable on Ritual Chain." },
          nextStep: "paste_solidity" as const,
        };
  }

  if (input.registry.status === "TRUSTED" && input.registry.isFresh) {
    return {
      decision: { value: "ALLOW" as const, reason: "A current project-level Omen signal exists. This is pre-action context, not a safety guarantee." },
      nextStep: "no_action" as const,
    };
  }

  if (input.registry.status === "LAPSED" || input.registry.status === "PENDING") {
    return {
      decision: { value: "REVIEW" as const, reason: "The Omen signal is stale or pending and should be refreshed or reviewed before acting." },
      nextStep: "refresh_check" as const,
    };
  }

  if (input.registry.status === "UNAVAILABLE") {
    return {
      decision: { value: "UNKNOWN" as const, reason: "OmenRegistry could not be read, so no project-level signal decision is available." },
      nextStep: "no_action" as const,
    };
  }

  return {
    decision: { value: "UNKNOWN" as const, reason: "No project-level Omen signal exists for this address and domain." },
    nextStep: "refresh_check" as const,
  };
}

export function normalizeScanChain(value: unknown) {
  if (value === undefined || value === null || value === "") return RITUAL_CHAIN_ID;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === String(RITUAL_CHAIN_ID) || normalized === "ritual" || normalized === "ritual-chain") {
    return RITUAL_CHAIN_ID;
  }
  return null;
}

export async function runPreActionScan(addressInput: string): Promise<PreActionScanResponse> {
  if (!isAddress(addressInput)) throw new Error("address must be a valid EVM address.");

  const address = getAddress(addressInput);
  const rpcUrl = process.env.RITUAL_RPC_URL || RITUAL_PUBLIC_RPC_URL;
  const ritualChain = defineChain({
    id: RITUAL_CHAIN_ID,
    name: RITUAL_CHAIN_NAME,
    nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
  const client = createPublicClient({ chain: ritualChain, transport: http(rpcUrl) });
  const warnings = ["Omen signals are project-level trust/risk signals, not an official Ritual endorsement."];

  let addressType: PreActionAddressType = "unknown";
  let hasBytecode: boolean | null = null;
  try {
    const code = await client.getCode({ address });
    hasBytecode = Boolean(code && code !== "0x");
    addressType = hasBytecode ? "contract" : "wallet";
  } catch {
    warnings.push("Contract bytecode lookup was unavailable.");
  }

  let registry: RegistryRead = { status: "UNAVAILABLE", hasRecord: false, isFresh: false };
  try {
    const [verdict, timestamp, , isRevoked, isFresh] = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_READ_ABI,
      functionName: "readVerdict",
      args: [address, DEFAULT_SCAN_DOMAIN],
    });
    registry = registryStatus(Number(verdict), timestamp, Boolean(isRevoked), Boolean(isFresh));
  } catch {
    warnings.push("OmenRegistry lookup was unavailable.");
  }

  let feeSummary: Awaited<ReturnType<typeof getRitualFeeSummary>> | undefined;
  if (addressType === "wallet") {
    try {
      feeSummary = await getRitualFeeSummary(address);
      if (!feeSummary.coverage.complete) warnings.push("Fee coverage reached the indexer pagination safety limit.");
    } catch {
      warnings.push("Indexed outgoing transactions and fees were unavailable.");
    }
  }

  const verifiedSourceAvailable = false;
  const sourceLookupStatus: ContractSourceLookupStatus =
    addressType === "contract"
      ? "unavailable_on_ritual"
      : addressType === "wallet"
        ? "not_applicable"
        : "rpc_unavailable";
  if (addressType === "contract") {
    warnings.push("Verified Solidity source lookup is not currently available for Ritual Chain contracts.");
  }

  const outcome = chooseDecision({ addressType, registry, sourceAvailable: verifiedSourceAvailable });

  return {
    schemaVersion: PRE_ACTION_SCAN_SCHEMA_VERSION,
    address,
    chainId: RITUAL_CHAIN_ID,
    addressType,
    activity: {
      ...(feeSummary
        ? {
            ...(feeSummary.balanceRit ? { balanceRit: feeSummary.balanceRit } : {}),
            balanceSource: feeSummary.balanceRit ? ("ritual-rpc" as const) : ("unavailable" as const),
            outgoingTxCount: feeSummary.outgoingTxCount,
            totalFeesRit: feeSummary.totalFeesRit,
            averageFeeRit: feeSummary.averageFeeRit,
            highestFeeRit: feeSummary.highestFeeRit,
            coverageComplete: feeSummary.coverage.complete,
          }
        : { balanceSource: "unavailable" as const }),
      source: feeSummary ? "ritual-explorer-indexer" : "unavailable",
    },
    contract: {
      hasBytecode,
      verifiedSourceAvailable,
      sourceLookupStatus,
    },
    omen: {
      registryStatus: registry.status,
    },
    decision: outcome.decision,
    nextStep: outcome.nextStep,
    warnings,
    metadata: {
      timestamp: new Date().toISOString(),
      providerUsed: "ritual-rpc",
      extensionReady: true,
    },
  };
}

export function describeScanNetwork() {
  return { chainId: RITUAL_CHAIN_ID, name: RITUAL_CHAIN_NAME };
}
