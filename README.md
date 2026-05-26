# Omen — Trust Judgment for Ritual Chain

> *Signs read from evidence. Verdicts that persist. Agents that act on what they know.*

---

Omen is a trust judgment protocol built natively on Ritual chain. It answers one question that every agent, contract, and human faces when operating onchain:

**"Can I trust this counterparty — and can I prove why?"**

Not with a score. Not with a heuristic. With a reproducible, Merkle-committed evidence artifact, an on-chain judgment stored with full revision history, and a compact verdict mirror that any downstream system can read in a single call.

---

# Why This Exists

Ritual gives agents the ability to observe onchain behavior. But observation alone is not enough. An agent can see that a wallet has made 40 transactions. It cannot, from that fact alone, determine whether the wallet is safe to trade with  not without evaluation logic, not without evidence standards, and not without a shared layer that other agents can trust too.

Most systems solve this by inlining the logic. A threshold check here, a flag lookup there. The judgment is invisible, the evidence is never committed, and no other agent can verify what you decided or why. That works in simple cases. It breaks down the moment you have multiple agents that need to coordinate around trust, or a human who needs to audit a decision after the fact.

Omen is the missing layer. It takes behavioral signals, evaluates them against domain-specific rules, stores the result on chain with a Merkle root, and exposes a cheap registry that any agent can consume. The judgment is inspectable. The evidence is reproducible. The history is permanent.

---

# The Flow

```
observe wallet or agent behavior on Ritual
              ↓
build a SignalObject Merkle committed evidence artifact
              ↓
evaluate against domain policy → VerdictObject stored on-chain
              ↓
mirror compact verdict to OmenRegistry
              ↓
agents read registry in one call and act accordingly

SEALED → allow    REVOKED → deny    UNSEEN → collect signal first
```

---

# Verdicts

Every subject in every domain resolves to one of five states:

| Verdict    | What it means                             | What agents do           |
|------------|-------------------------------------------|--------------------------|
| `SEALED`   | Clean behavioral profile, trusted         | Proceed with the action  |
| `REVOKED`  | Flagged activity, unsafe to interact with | Block the action         |
| `PENDING`  | Inconclusive evidence, low confidence     | Review before acting     |
| `UNSEEN`   | No evidence collected yet                 | Build signal first       |
| `LAPSED`   | Verdict is stale, needs refresh           | Re-evaluate the subject  |

These are not scores. They are bounded, actionable states with explicit semantics. An agent that reads `SEALED` from OmenRegistry knows exactly what to do. An agent that reads `REVOKED` does not need to guess.

---

# Live Domains

Two domains are deployed and active on Ritual testnet.

# `counterparty_trust.ritual_trade_v1`

*Should this wallet be trusted as a trading counterparty?*

This domain evaluates a wallet behavioral history  how many transactions it has made, how many failed, whether it holds unbounded approvals, and whether it has appeared in flagged interaction patterns. High activity with a clean posture yields `SEALED`. Flagged interactions or aggressive approval patterns yield `REVOKED`. Limited but clean history yields `PENDING`.

Evidence features: `tx_count` · `failed_tx` · `unique_counterparties` · `unbounded_approvals` · `flagged_interactions`

---

# `agent_safety.ritual_infernet_v1`

*Should this Ritual agent be permitted to act autonomously?*

This domain evaluates an agent operational safety profile  whether it has attempted unauthorized actions, how its anomaly score trends, and whether its model configuration has shifted. A stable agent with no unauthorized attempts and a low anomaly score yields `SEALED`. Any unauthorized action or anomaly above 70 yields an immediate `REVOKED`.

Evidence features: `action_count` · `failed_actions` · `unauthorized_attempts` · `model_changes` · `anomaly_score`

---

# Protocol Objects

Every judgment produces a chain of four artifacts:

**SignalObject** — The evidence artifact. Observation window (start block, end block), derived feature values, and a Merkle root committing the full evidence set. Fully reproducible: given the same subject, domain, and block window, anyone can rebuild this object and verify the root matches what's on-chain.

**ReadingArtifact** — The intermediate assessment. The result of evaluating the SignalObject against domain policy, before the transaction is submitted. Used for preview and local verification.

**VerdictObject** — The on-chain judgment. Stored in `OmenJudgment` with full revision history. Every re-evaluation increments the revision counter. The verdict, reasoning string, signal root, and timestamp are all stored and permanently queryable.

**OmenRegistry entry** — The compact mirror. A single mapping from `(subject, domain) → verdict` that downstream systems read on the hot path. No need to touch the judgment contract. One call returns the verdict, freshness status, and handshake decision.

---

# Architecture

```
                    ┌─────────────────────────────────┐
                    │         Next.js Frontend         │
                    │  Builder · Verdict · Demo · Docs │
                    └────────────────┬────────────────┘
                                     │ fetch
                              ┌──────┴──────┐
                              │  Python API  │
                              │ omen_api.py  │
                              └──────┬──────┘
                    ┌────────────────┼────────────────┐
                    │                                  │
             Evidence Layer                    Ritual Chain (1979)
             build_signal_object()                     │
             evaluate_locally()             ┌──────────┴──────────┐
                    │                       │                      │
             submit_tx.ts ──────────► OmenJudgment          OmenRegistry
             (ethers.js,                (evidence +          (compact mirror,
              Ritual native              revisioned            hot-path reads)
              tx format)                 verdicts)
                                               │
                                  ┌────────────┴────────────┐
                                  │                         │
                           OmenAgentAware            OmenAgentDirect
                           (reads registry           (no verdict check,
                            before acting)            benchmark baseline)
```

The frontend never holds a private key. The Python API builds evidence and coordinates with the ethers.js submission layer, which uses Ritual's native transaction format. The registry is the read surface  cheap, stateless, and always current.

---

# Contracts on Ritual Testnet

| Contract          | Address                                        | Role                                      |
|-------------------|------------------------------------------------|-------------------------------------------|
| `OmenJudgment`    | `0xc32a1e26e77664753b4A54a4312dF0a8159147D0`   | Evidence intake, verdict issuance, history |
| `OmenRegistry`    | `0xCbB34EB8651dc8f1d65a20165C1166C13f626620`   | Compact mirror for hot-path consumption   |
| `OmenAgentAware`  | `0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295`   | Verdict-aware benchmark agent             |
| `OmenAgentDirect` | `0x7040235955B2D397d7CB717a300911Ec68644aFe`   | Direct-action comparison agent            |

Explorer: [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)

---

# Pre-seeded Demo Subjects

Three subjects are live on chain with seeded verdicts for immediate demo use:

| Address                                          | Domain                               | Verdict    |
|--------------------------------------------------|--------------------------------------|------------|
| `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001`     | `counterparty_trust.ritual_trade_v1` | `SEALED`   |
| `0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c`     | `counterparty_trust.ritual_trade_v1` | `REVOKED`  |
| `0x0000000000000000000000000000000000000b0b`     | `agent_safety.ritual_infernet_v1`    | `SEALED`   |

---

## Running It Locally

You need Node.js, Python 3.11+, and a Ritual testnet wallet with faucet funds.

```bash
# 1. Clone and install
git clone <repo>
cd omen
npm install

# 2. Configure
cp .env.example .env
# Fill in PRIVATE_KEY (no 0x prefix)

# 3. Compile contracts
npx hardhat compile

# 4. Deploy to Ritual
npx hardhat run scripts/deploy.ts --network ritual
# Addresses saved automatically to deployments.json

# 5. Update .env with contract addresses from deployments.json
# Then copy to api folder
cp .env api/.env

# 6. Seed demo subjects
npx hardhat run scripts/seed.ts --network ritual

# 7. Start the API
cd api
pip install -r requirements.txt
python omen_api.py

# 8. Start the frontend (new terminal)
cd web
npm install
npm run dev
```

Open `http://localhost:3000`, go to the Signal Builder, paste any wallet address, and run through all four steps. The verdict is written to Ritual chain in real time.

---

# Project Structure

```
omen/
├── contracts/
│   ├── OmenJudgment.sol       # Core: evidence intake, verdict issuance, revision history
│   ├── OmenRegistry.sol       # Mirror: cheap hot-path verdict reads
│   ├── OmenAgentAware.sol     # Demo: agent that checks registry before acting
│   └── OmenAgentDirect.sol    # Demo: baseline agent with no verdict check
├── scripts/
│   ├── deploy.ts              # Deploy all four contracts, wire them, save addresses
│   ├── seed.ts                # Seed three demo subjects with live verdicts
│   └── submit_tx.ts           # Ethers.js transaction submission (Ritual native format)
├── api/
│   ├── omen_api.py            # Flask API: evidence building, verdict evaluation, registry reads
│   └── requirements.txt
├── web/
│   └── app/
│       ├── page.tsx           # Home — live stats, domain overview
│       ├── builder/           # Signal Builder — 4-step evidence and verdict flow
│       ├── verdict/           # Verdict Explorer — look up any wallet
│       ├── demo/              # Demo Lab — live benchmark across pinned subjects
│       ├── domains/           # Domain Explorer — OmenSpec browser
│       └── proofs/            # Proof Bundles — raw SignalObject inspector
├── hardhat.config.ts          # Ritual chain config (chain ID 1979)
├── deployments.json           # Generated on deploy — contract addresses
└── .env.example
```

---

# What Makes Omen Different

There are reputation systems that produce a score. There are blacklists that produce a boolean. Omen produces neither.

It produces an inspectable judgment  a structured artifact that tells you what evidence was observed, what domain policy was applied, what verdict was reached, and what the downstream action should be. Every piece of that is on chain, permanently. Every re-evaluation adds to the history without erasing what came before.

The evidence is reproducible. The same subject, domain, and block window always produces the same Merkle root. Anyone can verify the evidence that went into a judgment without trusting the party who built it.

The verdicts are bounded. Five states. Five actions. No interpretation required. An agent consuming `SEALED` from OmenRegistry does not need to understand what produced it  the verdict carries its own semantics.

The consumption is cheap. OmenRegistry is a read optimized mirror. Agents on the hot path pay minimal gas for a single mapping lookup. The judgment contract is only touched when new evidence is being submitted or a verdict is being re-evaluated.

---

# Connection to Ritual's Vision

Ritual is building the infrastructure for intelligent onchain systems — agents that observe, decide, and act autonomously. Omen is the trust substrate that makes those systems safe to compose.

When two Ritual agents want to transact, they need a shared answer to the question of whether the counterparty can be trusted. Omen provides that answer in a form both agents can verify independently. When a human wants to audit what an agent decided and why, Omen provides the evidence trail. When a domain needs to be extended to cover new behavior patterns, the protocol object model supports new domains without changing the consumption interface.

The current version uses deterministic evaluation rules. The next version connects to Ritual's Infernet layer — replacing deterministic rules with an attested model call that proves which AI model produced the verdict and what it saw. The contract interfaces, protocol objects, and consumption model are already designed for this. No breaking changes required.

---

# Whats Next

- **Infernet integration** — on-chain attested model calls replacing deterministic evaluation, with proof of which model ran
- **Public deployment** — Vercel frontend + Render API, accessible to anyone in the Ritual ecosystem
- **Model integrity domain** — `model_integrity.ritual_attestation_v1` for verifying agent model provenance
- **Multi-agent coordination** — Omen verdicts as shared primitives for trust-gated agent interactions

---

*Built on Ritual chain · Chain ID 1979 · Block time ~350ms · RPC: rpc.ritualfoundation.org*
