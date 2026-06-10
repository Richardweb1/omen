# Omen Web

Omen is trust infrastructure for autonomous Ritual agents. It lets users check registry-backed trust signals and mint Ritual-registered Trust Receipts that capture trust state at mint time.

This web app is the active Omen product surface.

## Active Page

- `/` - Complete trust check, result summary, build/refresh, re-check, final Trust Receipt minting, and real activity feed.

Compatibility and hidden routes still exist for reference, but they are not part of the primary product navigation:

- `/builder` - redirects to `/`
- `/check`
- `/agents`
- `/architecture`
- `/demo`
- `/audit`

## Home

Home reads real `OmenRegistry` data. It does not fabricate verdicts or derive trust from address hashing.

The user flow is:

```text
Paste Address
-> Read OmenRegistry
-> Show Trust Signal
-> Show Result Summary
-> Recommend Action
-> Build or refresh signal when needed
-> Re-check OmenRegistry
-> Mint Trust Receipt as the final step
```

Read/check actions do not require a wallet. Minting and trust-signal writes require a connected wallet on Ritual `1979`. The receipt step appears after the registry check and is enabled only when a real registry record exists. Stale records mint as historical snapshots; refresh remains a secondary action before acting.

The supported product states are:

- `TRUSTED`
- `REVOKED`
- `PENDING`
- `UNSEEN`
- `LAPSED`

## Omen Trust Receipt

`OmenTrustReceipt` is an ERC721 contract on Ritual `1979`.

Deployed receipt contract:

```text
0x6E010B72337907D24eA6edcA4e27652e8bF4E397
```

The receipt contract reads `OmenRegistry` directly during mint and stores a historical snapshot of the registry-backed trust state. It blocks minting when no registry record exists.

A Trust Receipt is not permanent trust, a safety guarantee, an identity token, a reputation system, a blacklist, or a reward badge. Always re-check `OmenRegistry` before acting.

For hosted deployment, set:

```text
NEXT_PUBLIC_OMEN_TRUST_RECEIPT_ADDRESS=0x6E010B72337907D24eA6edcA4e27652e8bF4E397
```

Vercel environment variable changes require a new deployment before they are available to the app.

## Recent Trust Activity

Recent Trust Activity is shown only from real events:

- `OmenRegistry.VerdictMirrored`
- `OmenJudgment.VerdictIssued`
- `OmenAgentAware.HandshakeExecuted`

If no events are found, the UI shows an honest empty state.

## Home Build/Refresh

Home prepares transaction data only. The connected wallet signs every write and pays gas on Ritual.

The Home build/refresh flow is:

```text
Connect Wallet
-> Switch to Ritual Chain 1979
-> Prepare Signal Update
-> Sign submitSignal
-> Sign evaluateDeterministic
-> Read result back from OmenRegistry
```

Advanced signal inputs are available through a collapsed section. They are not shown as the default Home task.

## Active APIs

- `POST /api/verdict/read` - reads real `OmenRegistry` data.
- `GET /api/activity` - reads real recent contract events.
- `POST /api/verdict/evaluate` - prepares wallet-signed transaction data from bounded feature values.
- `POST /api/signal/summary` - previews bounded signal values.
- `POST /api/signal/build` - builds a signal object from bounded signal values.
- `POST /api/rpc` - proxies Ritual JSON-RPC calls.
- `GET /api/health` - reports Ritual status and contract addresses.

Disabled:

- `POST /api/audit/request` - disabled because primary Omen writes must not use a backend signer.

## Ritual Accuracy Notes

Use these phrases:

- registry-backed trust signals
- onchain registry records
- wallet-signed evidence submission
- wallet-signed Trust Receipt minting
- OmenRegistry reads
- Ritual testnet deployment
- historical trust snapshot
- agent decision gating

Avoid claims that imply the active product is a proof protocol, live AI audit product, backend-signed service, or broad reputation system.

## Legacy API

`../api/omen_api.py` is legacy infrastructure. The active product source of truth is this Next.js app and its wallet-signed Home flow.
