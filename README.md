# Omen

Omen is trust infrastructure for autonomous Ritual agents. It lets users check registry-backed trust signals and mint Ritual-registered Trust Receipts that capture the trust state at mint time.

Omen helps users and agents check trust before coordinating:

```text
Paste Address
-> Read OmenRegistry
-> Understand Result
-> Decide What To Do
-> Build or refresh signal when needed
-> Re-check OmenRegistry
-> Mint Trust Receipt as the final step
```

Omen is not a chatbot, reputation score, blacklist, AI oracle, identity system, reward program, or NFT marketplace. It is a focused Ritual testnet product for reading registry-backed trust state and recording wallet-signed trust snapshots.

Omen also includes a read-only Agent Contract Risk Check for reviewing Solidity contract risk before users or agents interact with a contract. This is a pre-launch risk review, not a formal audit guarantee.

Live: [omen-ritual.vercel.app](https://omen-ritual.vercel.app)  
GitHub: [github.com/Richardweb1/omen](https://github.com/Richardweb1/omen)  
Chain: Ritual testnet, chain ID `1979`

---

## Product Flow

The active product lives on Home (`/`).

1. Paste an address.
2. Omen reads `OmenRegistry`.
3. The user sees a trust status summary, source, freshness, and recommended action.
4. If a real registry record exists, the user can mint an Omen Trust Receipt.
5. Home re-checks `OmenRegistry`.
6. If the signal is missing, stale, or inconclusive, the user can build or refresh the registry signal.
7. `OmenTrustReceipt` reads `OmenRegistry` during mint.
8. The receipt NFT is minted on Ritual `1979` as an onchain trust snapshot.

Read/check actions do not require a wallet. Write actions, including building trust signals and minting Trust Receipts, require a connected wallet on Ritual `1979`. Minting is available only when a real registry record exists; stale records mint as historical snapshots, not current trust.

The Home page does not fabricate verdicts. If `OmenRegistry` has no record, Omen shows `UNSEEN`/no record and disables receipt minting. For the Ritual Testnet Participant domain, outgoing Ritual transactions can qualify the connected wallet to create a real registry-backed participant record through wallet-signed transactions. If a record exists but is stale, Omen shows `LAPSED`/needs refresh and still allows a historical Trust Receipt.

The Contract Risk Check route (`/risk-check`) is read-only and stateless. It reviews pasted Solidity source with deterministic pattern checks and the configured server-side analysis provider. It does not write to `OmenRegistry`, mint Trust Receipts, or store submitted contracts.

---

## Trust Signals

Every trust check resolves to one of five product states:

| Signal | Meaning | Recommended Action |
|---|---|---|
| `TRUSTED` | A fresh trusted signal exists | Execute |
| `REVOKED` | A fresh revoked signal exists | Deny |
| `PENDING` | A fresh inconclusive signal exists | Review First |
| `UNSEEN` | No registry signal exists | Build Signal |
| `LAPSED` | A signal exists but is not fresh | Mint receipt or refresh |

Contract note: the deployed contracts use enum value `1` as `SEALED`; the product presents that state as `TRUSTED`.

---

## Omen Trust Receipt

An Omen Trust Receipt is an ERC721 NFT deployed on Ritual `1979`.

It means:

```text
At the time this receipt was minted, this subject had this registry state according to OmenRegistry.
```

`OmenTrustReceipt`:

- Reads `OmenRegistry` directly during `mint(subject, domain)`
- Stores a snapshot of the registry-backed trust state
- Stores subject, domain, status, registry address, chain ID, mint block, registry timestamp, minted time, freshness, and minter
- Blocks minting if no registry record exists
- Emits `TrustReceiptMinted`
- Provides token metadata that describes the receipt as a registry-backed snapshot

It does not represent permanent trust. It does not guarantee safety. It is not an identity NFT, reputation score, blacklist, reward badge, or proof protocol.

Always re-check `OmenRegistry` before acting.

---

## Deployed Contracts

| Contract | Address | Role |
|---|---|---|
| `OmenRegistry` | `0xCbB34EB8651dc8f1d65a20165C1166C13f626620` | Compact trust mirror and read path |
| `OmenTrustReceipt` | `0x6E010B72337907D24eA6edcA4e27652e8bF4E397` | ERC721 trust snapshot receipt |
| `OmenJudgment` | `0xC8Bb8fAC3e15405a9cD263071105CA7E3AafcFaE` | Evidence intake, verdict issuance, revision history |
| `OmenAgentAware` | `0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295` | Agent-aware contract support that checks registry state |

Explorer: [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)

Successful Trust Receipt mint example:

- Token ID: `1`
- Mint transaction: [`0x21ec363204667febaae8b661500f8f96209ec0ebb32db32df54423e5d3ce14d3`](https://explorer.ritualfoundation.org/tx/0x21ec363204667febaae8b661500f8f96209ec0ebb32db32df54423e5d3ce14d3)
- Demo/test subject: `0x8A5E192Dee78097D96fEdDf7f61b1Ab17A712234`

The demo/test subject is not a safety guarantee. It is only an address with real OmenRegistry records that can be used to exercise the product flow.

---

## Recent Trust Activity

The homepage includes a lightweight trust activity feed.

It reads real events only from:

- `OmenRegistry.VerdictMirrored`
- `OmenJudgment.VerdictIssued`
- `OmenAgentAware.HandshakeExecuted`

If no recent events are found, Omen displays an honest empty state. The feed never fabricates activity.

---

## Trust Domains

### `counterparty_trust.ritual_trade_v1`

Question: should this wallet or counterparty be trusted before coordination?

### `agent_safety.ritual_infernet_v1`

Question: should this agent be allowed to operate independently?

This domain id is retained for deployed-contract compatibility. The active Home flow should not be described as a Ritual Infernet integration unless a future implementation wires Infernet into the active product.

### `ritual_testnet_participant_v1`

Question: has this connected wallet used Ritual testnet and created a registry-backed participant record?

Omen reads outgoing transactions with `eth_getTransactionCount(address, "latest")`. This is an outgoing nonce count only; it does not include incoming transfers. Activity qualifies the connected wallet to create a participant record, but it does not imply permanent trust, identity verification, official Ritual approval, or a reputation score.

---

## Architecture

Read flow:

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

Trust Receipt mint flow:

```text
Connected Wallet
  |
  | signs mint(subject, domain)
  v
OmenTrustReceipt
  |
  | reads OmenRegistry during mint
  v
Stores receipt snapshot
  |
  v
ERC721 Trust Receipt on Ritual 1979
```

Trust signal write flow:

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
Home reads registry state
```

---

## Route Model

Visible product routes:

- `/` - Complete trust check, build/refresh, re-check, final receipt minting, and real activity feed
- `/risk-check` - Read-only Agent Contract Risk Check for pasted Solidity source

Hidden routes retained for future reuse:

- `/builder` - redirects to `/` for backward compatibility
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
- `POST /api/verdict/evaluate` - prepares wallet-signed transaction data from bounded feature values
- `POST /api/risk-check` - runs read-only Solidity risk review with the configured server-side analysis provider
- `POST /api/rpc` - proxies Ritual JSON-RPC calls for transaction confirmation
- `GET /api/health` - reports Ritual status and contract addresses

Disabled:

- `POST /api/audit/request` - disabled because primary Omen writes must not use a backend signer

---

## Security Posture

Omen's primary write flows are wallet-signed.

- No backend wallet signing
- No hidden signer for primary writes
- No private key required for read-only Home checks
- Read actions do not require wallet signatures
- Write and mint actions require connected wallet signatures
- Home requires Ritual chain `1979` before signing write transactions
- `OmenTrustReceipt` reads `OmenRegistry` directly during mint
- No-record addresses cannot mint Trust Receipts
- Contract Risk Check is read-only and does not store submitted contracts
- Environment files are ignored by git

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

For local public web configuration:

```text
NEXT_PUBLIC_OMEN_TRUST_RECEIPT_ADDRESS=0x6E010B72337907D24eA6edcA4e27652e8bF4E397
```

For local Ritual read configuration:

```text
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
OMEN_REGISTRY_ADDRESS=0xCbB34EB8651dc8f1d65a20165C1166C13f626620
OMEN_JUDGMENT_ADDRESS=0xC8Bb8fAC3e15405a9cD263071105CA7E3AafcFaE
OMEN_AGENT_AWARE_ADDRESS=0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295
```

For Agent Contract Risk Check:

```text
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

OpenRouter is the default provider when `AI_PROVIDER` is omitted. Optional OpenAI setup:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Only server-side keys are supported for `/api/risk-check`. Never use `NEXT_PUBLIC_` keys for AI providers. Submitted Solidity source is sent to the configured analysis provider and is not stored by Omen.

Do not expose private keys in frontend code or documentation.

For hosted deployment on Vercel, set:

```text
NEXT_PUBLIC_OMEN_TRUST_RECEIPT_ADDRESS=0x6E010B72337907D24eA6edcA4e27652e8bF4E397
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Vercel environment variable changes require a new deployment before they are available to the app.

---

## Project Structure

```text
omen/
  contracts/
    OmenRegistry.sol
    OmenJudgment.sol
    OmenTrustReceipt.sol
    OmenAgentAware.sol
  scripts/
    deploy.ts
    deployReceipt.ts
    seed.ts
  web/
    app/
      page.tsx
      api/activity/route.ts
      api/verdict/read/route.ts
      api/verdict/evaluate/route.ts
    components/
      Nav.tsx
      ConnectWallet.tsx
      InlineSignalBuilder.tsx
      TrustReceiptMinter.tsx
    lib/
      contracts.ts
      trustDomains.ts
```

---

## Known Notes

- Some registry signals may appear as `LAPSED` if they are no longer fresh.
- A stale Trust Receipt is still a historical snapshot, not current trust.
- The activity feed may be empty when there are no recent real events.
- Hidden routes still exist in the repository but are not part of the primary product navigation.
- Future work should continue improving evidence quality and contract-side authorization around feature submission.

---

Omen: check trust before coordinating.
