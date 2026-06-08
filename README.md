# Omen

**Trust infrastructure for Ritual agents, wallets, contracts, and autonomous systems.**

Omen helps users and agents check trust before coordinating.

Before interacting with an address, contract, agent, or autonomous system:

```text
Paste Address
-> Check Trust
-> Read OmenRegistry
-> Understand Risk
-> Decide What To Do
```

Omen is not a chatbot, reputation score, or marketing dashboard. It is a focused Ritual-native trust layer that reads and writes bounded trust signals onchain.

Live: [omen-ritual.vercel.app](https://omen-ritual.vercel.app)  
GitHub: [github.com/Richardweb1/omen](https://github.com/Richardweb1/omen)  
Chain: Ritual testnet, chain ID `1979`

---

## Product

Omen has two primary pages.

### 1. Home

The homepage is the main product experience.

It lets a user paste any address and read real trust state from `OmenRegistry`.

Supported subjects:

- Wallets
- Agents
- Contracts
- Autonomous systems

The result shows:

- Trust signal
- Recommended action
- Explanation
- Source
- Freshness
- Optional explorer link
- Recent trust activity

The homepage does not fabricate verdicts. If `OmenRegistry` has no record, Omen shows `UNSEEN`. If a record exists but is stale, Omen shows `LAPSED`.

### 2. Builder

Builder is the onchain write path.

It lets a connected wallet create trust signals on Ritual.

Builder requirements:

- User connects wallet
- User is on Ritual chain `1979`
- User provides evidence feature values
- User signs `submitSignal`
- User signs `evaluateDeterministic`
- User pays gas
- Transaction hashes and explorer links are displayed
- Final result is read back from `OmenRegistry`

There is no backend wallet signing in the primary product flow.

---

## Trust Signals

Every trust check resolves to one of five product states:

| Signal | Meaning | Recommended Action |
|---|---|---|
| `TRUSTED` | A fresh trusted signal exists | Execute |
| `REVOKED` | A fresh revoked signal exists | Deny |
| `PENDING` | A fresh inconclusive signal exists | Review First |
| `UNSEEN` | No registry signal exists | Build Signal |
| `LAPSED` | A signal exists but is not fresh | Build Signal |

Contract note: the deployed contracts use enum value `1` as `SEALED`; the product presents that state as `TRUSTED`.

---

## Where Trust Comes From

Omen reads the registry first.

The current trust-check API calls:

- `OmenRegistry.readVerdict(subject, domain)`
- `OmenRegistry.previewHandshake(subject, domain, action)`

The frontend displays:

- `Source: OmenRegistry`
- `Fresh: Yes / No`
- A simple explanation based on the registry state

Omen does not derive trust from address hashing in the Home trust check.

---

## Recent Trust Activity

The homepage includes a lightweight trust activity feed.

It reads real events only from:

- `OmenRegistry.VerdictMirrored`
- `OmenJudgment.VerdictIssued`
- `OmenAgentAware.HandshakeExecuted`

If no recent events are found, Omen displays an honest empty state.

The feed never fabricates activity.

---

## Trust Domains

### `counterparty_trust.ritual_trade_v1`

Question: should this wallet or counterparty be trusted before coordination?

Evidence fields used by Builder:

- `tx_count`
- `failed_tx`
- `unique_counterparties`
- `unbounded_approvals`
- `flagged_interactions`

### `agent_safety.ritual_infernet_v1`

Question: should this agent be allowed to operate independently?

Evidence fields used by Builder:

- `action_count`
- `failed_actions`
- `unauthorized_attempts`
- `model_changes`
- `anomaly_score`

---

## Architecture

```text
User / Agent
  |
  | paste address
  v
Next.js Home
  |
  | read-only API
  v
OmenRegistry
  |
  | trust state + freshness + handshake reason
  v
Trust Signal -> Recommended Action -> Explanation
```

Write flow:

```text
Connected Wallet
  |
  | signs submitSignal
  v
OmenJudgment
  |
  | signs evaluateDeterministic
  v
OmenJudgment issues verdict
  |
  v
OmenRegistry mirrors verdict
  |
  v
Home and Builder read registry state
```

---

## Contracts on Ritual Testnet

| Contract | Address | Role |
|---|---|---|
| `OmenRegistry` | `0xCbB34EB8651dc8f1d65a20165C1166C13f626620` | Compact trust mirror and read path |
| `OmenJudgment` | `0xc32a1e26e77664753b4A54a4312dF0a8159147D0` | Evidence intake, verdict issuance, revision history |
| `OmenAgentAware` | `0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295` | Agent contract that checks registry before acting |
| `OmenAgentDirect` | `0x7040235955B2D397d7CB717a300911Ec68644aFe` | Baseline direct-action agent |
| `OmenJudgmentLLM` | `0x4d6f86B615e4B793B43BCd9868D0E3cBD7b64947` | Ritual LLM precompile evaluation contract |
| `OmenSovereignAgent` | `0x3260dDe013d8c5130092B3DFB7d44DdD995da528` | Scheduler-driven signal refresh agent |
| `OmenAuditGateway` | `0x2E1C8812F0b636579589A3bA1C0e64c1D9ED7f6f` | Older audit gateway, not part of primary product flow |

Explorer: [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)

---

## Current Route Model

Visible product routes:

- `/` - Home trust check and real activity feed
- `/builder` - Wallet-signed signal creation

Hidden routes retained for future reuse:

- `/check`
- `/agents`
- `/architecture`
- `/demo`
- `/audit`

These are not part of the primary navigation.

---

## API Routes

Primary active APIs:

- `POST /api/verdict/read` - reads real `OmenRegistry` data
- `GET /api/activity` - reads real recent contract events
- `POST /api/verdict/evaluate` - prepares wallet-signed Builder transaction data from user-provided feature values
- `POST /api/signal/summary` - previews user-provided evidence
- `POST /api/signal/build` - builds a signal object from user-provided evidence
- `POST /api/rpc` - proxies Ritual JSON-RPC calls
- `GET /api/health` - reports Ritual status and contract addresses

Disabled:

- `POST /api/audit/request` - disabled because primary Omen writes must not use a backend signer

---

## Security Posture

Omen's primary write flow is wallet-signed.

- No backend wallet signing for Builder
- No hidden signer for primary writes
- No private key required for read-only Home checks
- Read actions do not require wallet signatures
- Write actions require connected wallet signatures
- Builder requires Ritual chain `1979` before signing
- Transaction hashes are checked against Ritual RPC during confirmation

Environment files are ignored by git.

---

## Running Locally

Install root dependencies for contracts:

```bash
npm install
npm run compile
```

Install and run the web app:

```bash
cd web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

For local Ritual configuration, use:

```text
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
OMEN_REGISTRY_ADDRESS=0xCbB34EB8651dc8f1d65a20165C1166C13f626620
OMEN_JUDGMENT_ADDRESS=0xc32a1e26e77664753b4A54a4312dF0a8159147D0
OMEN_AGENT_AWARE_ADDRESS=0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295
```

Do not expose private keys in frontend code.

---

## Project Structure

```text
omen/
  contracts/
    OmenRegistry.sol
    OmenJudgment.sol
    OmenAgentAware.sol
    OmenAgentDirect.sol
    OmenJudgmentLLM.sol
    OmenSovereignAgent.sol
    OmenAuditGateway.sol
  scripts/
    deploy.ts
    seed.ts
    submit_tx.ts
    startAgent.ts
  web/
    app/
      page.tsx
      builder/page.tsx
      api/activity/route.ts
      api/verdict/read/route.ts
      api/verdict/evaluate/route.ts
      api/signal/build/route.ts
      api/signal/summary/route.ts
    components/
      Nav.tsx
      ConnectWallet.tsx
      WalletProvider.tsx
    lib/
      contracts.ts
```

---

## What Makes Omen Different

Omen keeps trust simple and inspectable.

- It answers one question: should this subject be trusted before coordination?
- It reads real registry state before presenting a verdict.
- It produces bounded states instead of scores.
- It explains the recommended action in plain language.
- It lets users create trust signals through wallet-signed onchain transactions.
- It creates recurring value through real trust events, not fabricated feeds.

---

## Known Notes

- Some seeded registry signals may appear as `LAPSED` if they are no longer fresh.
- The activity feed may be empty when there are no recent real events.
- Hidden routes still exist in the repository but are not part of the primary product navigation.
- Future work should continue improving evidence quality and contract-side authorization around feature submission.

---

Omen: check trust before coordinating.
