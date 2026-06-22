import { OMEN_EXTENSION_CONFIG } from "./config.mjs";
import { buildScanPayload, createScanViewModel, getApiOrigin, isValidEvmAddress } from "./popup-utils.mjs";

const elements = {
  form: document.querySelector("#scan-form"),
  address: document.querySelector("#address"),
  addressError: document.querySelector("#address-error"),
  button: document.querySelector("#scan-button"),
  status: document.querySelector("#request-status"),
  result: document.querySelector("#scan-result"),
  resultAddress: document.querySelector("#result-address"),
  decisionBadge: document.querySelector("#decision-badge"),
  addressType: document.querySelector("#address-type"),
  omenSignal: document.querySelector("#omen-signal"),
  contextLabel: document.querySelector("#context-label"),
  contextValue: document.querySelector("#context-value"),
  contextHelper: document.querySelector("#context-helper"),
  warningsPanel: document.querySelector("#warnings-panel"),
  warningsList: document.querySelector("#warnings-list"),
  fullAppLink: document.querySelector("#full-app-link"),
  feeSummary: document.querySelector("#fee-summary"),
  walletBalance: document.querySelector("#wallet-balance"),
  feeTotal: document.querySelector("#fee-total"),
  feeAverage: document.querySelector("#fee-average"),
  feeHighest: document.querySelector("#fee-highest"),
};

function setFieldError(message = "") {
  elements.addressError.textContent = message;
  elements.addressError.hidden = !message;
  elements.address.setAttribute("aria-invalid", message ? "true" : "false");
}

function setRequestStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  elements.button.disabled = isLoading;
  elements.button.textContent = isLoading ? "Scanning Ritual..." : "Scan with Omen";
}

function renderWarnings(warnings) {
  elements.warningsList.replaceChildren();
  for (const warning of warnings) {
    const item = document.createElement("li");
    item.textContent = warning;
    elements.warningsList.append(item);
  }
  elements.warningsPanel.hidden = warnings.length === 0;
}

function renderResult(scan) {
  const view = createScanViewModel(scan);
  elements.resultAddress.textContent = view.address;
  elements.resultAddress.title = view.address;
  elements.decisionBadge.textContent = view.decision;
  elements.decisionBadge.className = `decision-badge ${view.decisionTone}`;
  elements.addressType.textContent = view.addressTypeLabel;
  elements.omenSignal.textContent = view.omenSignal;
  elements.contextLabel.textContent = view.contextLabel;
  elements.contextValue.textContent = view.contextValue;
  elements.contextHelper.textContent = view.contextHelper;
  elements.feeSummary.hidden = !view.feeSummary;
  if (view.feeSummary) {
    elements.walletBalance.textContent = view.feeSummary.balance;
    elements.feeTotal.textContent = view.feeSummary.total;
    elements.feeAverage.textContent = view.feeSummary.average;
    elements.feeHighest.textContent = view.feeSummary.highest;
  }
  elements.fullAppLink.href = OMEN_EXTENSION_CONFIG.fullAppUrl;
  renderWarnings(view.warnings);
  elements.result.hidden = false;
  setRequestStatus(`Scan complete: ${view.addressTypeLabel}.`);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const address = elements.address.value.trim();
  setFieldError();

  if (!isValidEvmAddress(address)) {
    setFieldError("Enter a valid EVM address beginning with 0x.");
    setRequestStatus("The address could not be scanned.", true);
    elements.result.hidden = true;
    elements.address.focus();
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OMEN_EXTENSION_CONFIG.requestTimeoutMs);
  setLoading(true);
  setRequestStatus("Reading available Ritual and Omen context...");
  elements.result.hidden = true;

  try {
    const response = await fetch(`${getApiOrigin(OMEN_EXTENSION_CONFIG)}/api/pre-action-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildScanPayload(address, OMEN_EXTENSION_CONFIG)),
      signal: controller.signal,
    });
    const payload = await readJson(response);
    if (!response.ok) {
      const message = payload?.error?.message || `Omen returned HTTP ${response.status}.`;
      throw new Error(message);
    }
    if (!payload?.metadata?.extensionReady) {
      throw new Error("Omen returned an unsupported scan response.");
    }
    renderResult(payload);
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "The scan timed out. Check your connection and try again."
      : error instanceof Error
        ? error.message
        : "The scan could not be completed.";
    setRequestStatus(message, true);
  } finally {
    clearTimeout(timeout);
    setLoading(false);
  }
});
