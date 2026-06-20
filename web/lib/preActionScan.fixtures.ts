import type { PreActionScanResponse } from "@/lib/preActionScan";

export const walletScanFixture: PreActionScanResponse = {
  schemaVersion: "1.0",
  address: "0x8A5E192Dee78097D96fEdDf7f61b1Ab17A712234",
  chainId: 1979,
  addressType: "wallet",
  activity: {
    outgoingTxCount: 211,
    totalFeesRit: "0.0421",
    averageFeeRit: "0.0002",
    highestFeeRit: "0.003",
    source: "ritual-explorer-indexer",
    coverageComplete: true,
  },
  contract: { hasBytecode: false, verifiedSourceAvailable: false, sourceLookupStatus: "not_applicable" },
  omen: { registryStatus: "LAPSED" },
  decision: { value: "REVIEW", reason: "The Omen signal is stale or pending and should be refreshed or reviewed before acting." },
  nextStep: "refresh_check",
  warnings: [
    "Omen signals are project-level trust/risk signals, not an official Ritual endorsement.",
    "Outgoing transaction count is an RPC nonce and does not include incoming transfers.",
  ],
  metadata: { timestamp: "2026-06-19T00:00:00.000Z", providerUsed: "ritual-rpc", extensionReady: true },
};

export const contractScanFixture: PreActionScanResponse = {
  schemaVersion: "1.0",
  address: "0xCbB34EB8651dc8f1d65a20165C1166C13f626620",
  chainId: 1979,
  addressType: "contract",
  activity: { source: "unavailable" },
  contract: { hasBytecode: true, verifiedSourceAvailable: false, sourceLookupStatus: "unavailable_on_ritual" },
  omen: { registryStatus: "NO_RECORD" },
  decision: { value: "REVIEW", reason: "Contract bytecode was found, but verified source lookup is unavailable on Ritual Chain." },
  nextStep: "paste_solidity",
  warnings: [
    "Omen signals are project-level trust/risk signals, not an official Ritual endorsement.",
    "Verified Solidity source lookup is not currently available for Ritual Chain contracts.",
  ],
  metadata: { timestamp: "2026-06-19T00:00:00.000Z", providerUsed: "ritual-rpc", extensionReady: true },
};

export const invalidAddressFixture = {
  status: 400,
  body: {
    error: {
      code: "INVALID_ADDRESS",
      message: "address must be a valid EVM address.",
    },
  },
} as const;
