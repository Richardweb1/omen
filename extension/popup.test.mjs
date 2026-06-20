import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildScanPayload, createScanViewModel, isValidEvmAddress } from "./popup-utils.mjs";

const walletAddress = "0x8A5E192Dee78097D96fEdDf7f61b1Ab17A712234";
const contractAddress = "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";

assert.equal(isValidEvmAddress(walletAddress), true);
assert.equal(isValidEvmAddress("0x1234"), false);
assert.equal(isValidEvmAddress("not-an-address"), false);

const walletView = createScanViewModel({
  address: walletAddress,
  addressType: "wallet",
  activity: {
    outgoingTxCount: 236,
    totalFeesRit: "0.0421",
    averageFeeRit: "0.00017",
    highestFeeRit: "0.003",
    source: "ritual-explorer-indexer",
  },
  contract: { hasBytecode: false, verifiedSourceAvailable: false, sourceLookupStatus: "not_applicable" },
  omen: { registryStatus: "LAPSED" },
  decision: { value: "REVIEW", reason: "The Omen signal should be reviewed." },
  nextStep: "refresh_check",
  warnings: [],
  metadata: { timestamp: "2026-06-19T00:00:00.000Z", extensionReady: true },
});
assert.equal(walletView.addressTypeLabel, "Wallet detected");
assert.equal(walletView.contextValue, "236 outgoing transactions");
assert.equal(walletView.decision, "Check carefully");
assert.equal(walletView.omenSignal, "Needs refresh");
assert.equal(walletView.feeSummary.total, "0.0421 RIT");
assert.equal(walletView.feeSummary.highest, "0.003 RIT");

const contractView = createScanViewModel({
  address: contractAddress,
  addressType: "contract",
  activity: { source: "unavailable" },
  contract: { hasBytecode: true, verifiedSourceAvailable: false, sourceLookupStatus: "unavailable_on_ritual" },
  omen: { registryStatus: "NO_RECORD" },
  decision: { value: "REVIEW", reason: "Verified source is unavailable." },
  nextStep: "paste_solidity",
  warnings: [],
  metadata: { timestamp: "2026-06-19T00:00:00.000Z", extensionReady: true },
});
assert.equal(contractView.addressTypeLabel, "Smart contract detected");
assert.equal(contractView.contextValue, "Verified source unavailable on Ritual");
assert.equal(contractView.nextStep, "Paste Solidity for risk review");

assert.deepEqual(buildScanPayload(walletAddress, { chainId: 1979 }), {
  address: walletAddress,
  chainId: 1979,
  appContext: "chrome-extension-popup-v1",
});

const manifest = JSON.parse(await readFile(new URL("./manifest.json", import.meta.url), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, []);
assert.equal("content_scripts" in manifest, false);
assert.equal("background" in manifest, false);

const popupSource = await readFile(new URL("./popup.mjs", import.meta.url), "utf8");
assert.match(popupSource, /\/api\/pre-action-scan/);
assert.doesNotMatch(popupSource, /\/api\/risk-check|ethereum\.request|chrome\.storage/);

console.log("Extension fixtures passed: invalid address, wallet result, contract result, and permission boundary.");
