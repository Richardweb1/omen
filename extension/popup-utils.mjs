const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const NEXT_STEP_LABELS = {
  scan_contract_source: "Review verified contract source",
  paste_solidity: "Paste Solidity for risk review",
  refresh_check: "Check this address again before acting",
  no_action: "No additional Omen action",
};

const SOURCE_STATUS_LABELS = {
  not_applicable: "Not applicable",
  available: "Verified source available",
  unavailable_on_ritual: "Verified source unavailable on Ritual",
  rpc_unavailable: "Source lookup unavailable",
};

const SIGNAL_LABELS = {
  TRUSTED: "Current signal",
  REVOKED: "Revoked signal",
  PENDING: "Pending review",
  LAPSED: "Needs refresh",
  NO_RECORD: "No Omen signal yet",
  UNAVAILABLE: "Signal unavailable",
};

const DECISION_LABELS = {
  ALLOW: "Proceed with context",
  REVIEW: "Check carefully",
  BLOCK: "Do not proceed",
  UNKNOWN: "More information needed",
};

export function isValidEvmAddress(value) {
  return ADDRESS_PATTERN.test(String(value || "").trim());
}

export function truncateAddress(value) {
  const address = String(value || "");
  return address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;
}

export function buildScanPayload(address, config) {
  return {
    address: String(address).trim(),
    chainId: config.chainId,
    appContext: "chrome-extension-popup-v1",
  };
}

export function getApiOrigin(config) {
  return config.useLocalDev ? config.localDevOrigin : config.productionOrigin;
}

export function createScanViewModel(scan) {
  const addressType = scan?.addressType;
  const isWallet = addressType === "wallet";
  const isContract = addressType === "contract";
  const outgoingTxCount = scan?.activity?.outgoingTxCount;
  const totalFeesRit = scan?.activity?.totalFeesRit;
  const sourceStatus = scan?.contract?.sourceLookupStatus;

  return {
    address: String(scan?.address || ""),
    shortAddress: truncateAddress(scan?.address),
    addressTypeLabel: isWallet ? "Wallet detected" : isContract ? "Smart contract detected" : "Address type unknown",
    contextLabel: isWallet ? "Ritual activity" : isContract ? "Contract source" : "Scan context",
    contextValue: isWallet
      ? Number.isInteger(outgoingTxCount)
        ? `${outgoingTxCount.toLocaleString()} outgoing transactions`
        : "Outgoing activity unavailable"
      : isContract
        ? SOURCE_STATUS_LABELS[sourceStatus] || "Source status unknown"
        : "Ritual RPC could not classify this address",
    contextHelper: isWallet
      ? scan?.activity?.source === "ritual-explorer-indexer"
        ? "Calculated from Ritual Explorer indexed outgoing transactions."
        : "Indexed fee history is unavailable."
      : isContract
        ? "Paste Solidity in the full app when verified source is unavailable."
        : "Try the scan again before relying on this result.",
    omenSignal: SIGNAL_LABELS[scan?.omen?.registryStatus] || "Signal unavailable",
    decision: DECISION_LABELS[String(scan?.decision?.value || "UNKNOWN").toUpperCase()] || "More information needed",
    decisionTone: String(scan?.decision?.value || "UNKNOWN").toLowerCase(),
    reason: scan?.omen?.registryStatus === "LAPSED"
      ? "This Omen result is old. Check it again before a user or agent acts."
      : String(scan?.decision?.reason || "No decision reason was returned."),
    nextStep: NEXT_STEP_LABELS[scan?.nextStep] || "Open the full Omen app",
    warnings: Array.isArray(scan?.warnings) ? scan.warnings.filter((warning) => typeof warning === "string") : [],
    timestamp: String(scan?.metadata?.timestamp || ""),
    feeSummary: isWallet && typeof totalFeesRit === "string"
      ? {
          total: `${totalFeesRit} RIT`,
          average: `${scan.activity.averageFeeRit || "0"} RIT`,
          highest: `${scan.activity.highestFeeRit || "0"} RIT`,
        }
      : null,
  };
}
