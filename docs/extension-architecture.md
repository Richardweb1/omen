# Omen Extension Architecture Plan

## Product Boundary

The extension is a future pre-action scanner for public addresses and transaction context. It should provide bounded Omen guidance such as `ALLOW`, `REVIEW`, or `BLOCK` without claiming an official Ritual endorsement, a formal audit, guaranteed safety, or complete transaction protection.

The first release must not request private keys, sign transactions, intercept wallet traffic, block wallet actions, store submitted Solidity, or submit onchain writes.

## Phase 1: Chrome Manifest V3 Popup

The permission-minimal popup MVP now lives in:

```text
extension/
  manifest.json
  config.mjs
  popup.html
  popup.css
  popup.mjs
  popup-utils.mjs
  popup.test.mjs
  README.md
```

The MVP has no extension permissions, content script, background service worker, or storage. Its host access is limited to the production Omen origin and local development origin. It does not request `storage`, `webRequest`, wallet-provider access, browsing history, or all-site access.

Popup flow:

1. User pastes a public EVM address.
2. User selects or confirms the network where needed.
3. User clicks **Scan with Omen**.
4. Popup shows wallet/EOA or smart-contract detection.
5. Popup shows available Omen signal, activity/source context, and a bounded `ALLOW`, `REVIEW`, or `BLOCK` recommendation with reasons.
6. Popup links to the full Omen web app for deeper source review, wallet signatures, registry writes, or receipt minting.

The popup should not run the signed Solidity risk-check flow itself in Phase 1. A contract result can link to `/risk-check` or the address-specific web flow.

## Reusable Omen APIs

- `POST /api/verdict/read`: read the project-level Omen signal for an address and domain.
- `GET /api/address-activity?address=...`: read the Ritual RPC outgoing nonce count with its existing reliability caveat.
- `POST /api/contract-source`: detect bytecode and attempt supported verified-source lookup.
- `POST /api/risk-check`: retain for the full web experience because it requires a wallet signature and sends source to the configured analysis provider.

The extension should not call `/api/rpc` as a general-purpose proxy. Prefer narrowly scoped endpoints with strict input validation.

## Pre-Action Scan API

The read-only aggregation endpoint is:

```text
POST /api/pre-action-scan
{
  "address": "0x...",
  "chainId": 1979,
  "origin": "optional bounded context label",
  "appContext": "optional bounded dApp context"
}
```

Ritual Chain is the only supported network in schema version `1.0`. The endpoint combines address validation, bytecode detection, Omen signal lookup, limited Ritual activity context, source availability, and a deterministic recommendation. It does not sign, write, mint, or invoke OpenRouter or Ritual LLM.

Stable success schema:

```json
{
  "schemaVersion": "1.0",
  "address": "0x...",
  "chainId": 1979,
  "addressType": "wallet | contract | unknown",
  "activity": {
    "outgoingTxCount": 211,
    "totalFeesRit": "0.0421",
    "averageFeeRit": "0.0002",
    "highestFeeRit": "0.003",
    "source": "ritual-explorer-indexer | unavailable"
  },
  "contract": {
    "hasBytecode": false,
    "verifiedSourceAvailable": false,
    "sourceLookupStatus": "not_applicable | available | unavailable_on_ritual | rpc_unavailable"
  },
  "omen": {
    "registryStatus": "TRUSTED | REVOKED | PENDING | LAPSED | NO_RECORD | UNAVAILABLE"
  },
  "decision": {
    "value": "ALLOW | REVIEW | BLOCK | UNKNOWN",
    "reason": "Human-readable bounded reason"
  },
  "nextStep": "scan_contract_source | paste_solidity | refresh_check | no_action",
  "warnings": [],
  "metadata": {
    "timestamp": "ISO-8601",
    "providerUsed": "ritual-rpc",
    "extensionReady": true
  }
}
```

Errors use `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. The optional body `origin` is context only and is not trusted for CORS. Cross-origin access is denied unless the real HTTP `Origin` is listed in server-only `OMEN_EXTENSION_ORIGINS`.

Before public extension rollout, replace the in-route rate-limit TODO with durable per-origin and per-IP enforcement. Do not use permissive `Access-Control-Allow-Origin: *` for signed or paid endpoints.

## Later Phases

### Transaction Context Preview

- Add an optional, narrowly scoped content script only on user-approved sites.
- Detect public contract addresses displayed by the dApp.
- Let the user explicitly scan a detected address.
- Keep all observations local unless the user requests a scan.

### Wallet Request Awareness

- Integrate through a wallet-supported transaction simulation or permissioned provider interface rather than injecting a competing wallet provider.
- Read transaction destination, chain ID, value, and calldata only after explicit user permission.
- Show a warning before signing, but do not modify, reject, or block the wallet request.
- Treat unknown calldata and proxy targets as `REVIEW`, not automatically `ALLOW`.

### Watched Addresses

- Store watched public addresses locally with `chrome.storage.local` by default.
- Sync only with explicit opt-in and a documented retention policy.
- Notify on meaningful Omen signal changes without presenting monitoring as comprehensive security coverage.

## Decision Semantics

- `ALLOW`: no blocking condition was found by the checks that actually ran. This is not a safety guarantee.
- `REVIEW`: data is missing, stale, ambiguous, unverified, or requires manual inspection.
- `BLOCK`: an explicit Omen revocation or high-confidence dangerous condition was found.

Every decision should include `checksRun`, `dataSources`, `limitations`, and `timestamp`. Missing source, unsupported networks, and unavailable APIs must fail toward `REVIEW` rather than inventing results.

## Privacy And Security Risks

- Browsing and transaction targets can reveal sensitive financial intent. Collect the minimum and avoid telemetry by default.
- Contract source and notes may be proprietary. Keep the full risk-check privacy warning and route users to the web app.
- Extension updates and dependencies are a supply-chain risk. Pin dependencies, enforce a restrictive CSP, and prohibit remote code execution.
- Cross-origin API access can create abuse and billing exposure. Separate read-only public endpoints from signed and paid analysis endpoints.
- Malicious pages can spoof addresses or UI. Display the exact normalized address and chain in the popup.
- Proxy contracts can hide implementation risk. Surface proxy uncertainty and avoid automatic `ALLOW`.
- Extension storage is not a secret vault. Never store private keys, seed phrases, provider secrets, or reusable signatures.

## Claims To Avoid

Do not claim that the extension is an official Ritual product, guarantees transaction safety, audits contracts, monitors every wallet action, verifies identity, provides permanent trust, or blocks malicious transactions. Until transaction-awareness is implemented and tested, describe it only as a manual Omen pre-action address scanner.

## MVP Verification And Rollout

The popup is tested against wallet and contract fixtures and calls only `POST /api/pre-action-scan`. Invalid addresses are rejected locally before a request is sent. API values are rendered with `textContent`, and the popup uses a restrictive extension-page content security policy.

An unpacked extension has an origin shaped like `chrome-extension://<extension-id>`. Add that exact origin to the server-only `OMEN_EXTENSION_ORIGINS` allowlist before live scans. Keep the production API as the default and switch `useLocalDev` in `extension/config.mjs` only during local development.

Before a public store release, add durable rate limiting to the read-only endpoint, package fixed extension icons, assign a stable extension ID, and repeat the wallet/contract live smoke tests against the production origin. Do not add transaction interception or broad page permissions to the MVP.
