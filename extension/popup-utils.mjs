const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const NEXT_STEP_LABELS = {
  scan_contract_source: "Review verified contract source",
  paste_solidity: "Paste Solidity for risk review",
  mint_receipt: "Open Omen to mint a signal receipt",
  refresh_check: "Review or refresh the Omen signal",
  no_action: "No additional Omen action",
};

const SOURCE_STATUS_LABELS = {
  not_applicable: "Not applicable",
  available: "Verified source available",
  unavailable_on_ritual: "Verified source unavailable on Ritual",
  rpc_unavailable: "Source lookup unavailable",
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
      ? "RPC nonce count only; incoming transfers are not included."
      : isContract
        ? "Paste Solidity in the full app when verified source is unavailable."
        : "Try the scan again before relying on this result.",
    omenSignal: String(scan?.omen?.registryStatus || "UNAVAILABLE").replaceAll("_", " "),
    decision: String(scan?.decision?.value || "UNKNOWN").toUpperCase(),
    reason: String(scan?.decision?.reason || "No decision reason was returned."),
    nextStep: NEXT_STEP_LABELS[scan?.nextStep] || "Open the full Omen app",
    warnings: Array.isArray(scan?.warnings) ? scan.warnings.filter((warning) => typeof warning === "string") : [],
    timestamp: String(scan?.metadata?.timestamp || ""),
  };
}
