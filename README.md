<img width="1857" height="915" alt="image" src="https://github.com/user-attachments/assets/4b1c5cac-4f4d-4af8-8182-109748fecd07" />
<img width="1062" height="857" alt="image" src="https://github.com/user-attachments/assets/0e2aa7fa-544a-4a67-87b5-3f7ade3df9f4" />
<img width="873" height="876" alt="image" src="https://github.com/user-attachments/assets/dc1ee03a-b013-406c-abd9-6e5debf2065f" />




## Omen — Trust Infrastructure for Ritual Agents

**Live:** [omen-ritual.vercel.app](https://omen-ritual.vercel.app) · **GitHub:** [github.com/Richardweb1/omen](https://github.com/Richardweb1/omen) · **Chain:** Ritual testnet (Chain ID 1979)

> *Verifiable Trust For Autonomous Coordination.*

---

Omen transforms onchain activity into verifiable trust signals that agents, wallets, and autonomous systems can consume before acting.

It is not a reputation score. It is not a blacklist. It is a trust primitive — a protocol layer that produces bounded, inspectable, Merkle-committed trust signals and exposes them through a cheap registry that any agent on Ritual can read in a single call.

**The core question Omen answers:**

> "Should this autonomous system coordinate with this counterparty — and can I prove why?"

---

## Why Omen Exists

Ritual gives agents the ability to observe and act onchain. But autonomous coordination requires more than observation. An agent needs to know whether a counterparty is safe to interact with before it acts — not after.

Most systems solve this by inlining trust logic. A threshold check here, a flag lookup there. The judgment is invisible, the evidence is never committed, and no other agent can verify what was decided or why.

Omen is the missing layer. It takes behavioral signals, evaluates them against domain-specific rules, stores the result onchain with a Merkle root, and exposes a compact registry that any agent can consume. The trust signal is inspectable. The evidence is reproducible. The history is permanent.

---

## Trust Signal Flow
Onchain Activity
↓
SignalObject — Merkle-committed evidence artifact
↓
Trust Signal — evaluated against domain policy, stored onchain
↓
OmenRegistry — compact mirror, hot-path reads
↓
Agent Decision — execute or reject based on trust signal
↓
Execution Result
---

## Trust-Aware Agent Execution

The most important capability Omen enables is **trust-aware agent execution**.

`OmenAgentAware` queries `OmenRegistry` before every autonomous action. The returned trust signal determines whether the agent proceeds or rejects — without human intervention.
Selected Address
↓
OmenRegistry — query trust signal
↓
Trust Signal — TRUSTED or REVOKED
↓
Agent Decision
↓
TRUSTED → Execution Allowed ✓
REVOKED → Execution Denied ✕
This is not a display feature. Omen actively modifies agent behavior based on verifiable trust signals. An agent reading `TRUSTED` from `OmenRegistry` proceeds. An agent reading `REVOKED` rejects. The decision is automatic, verifiable, and onchain.

---

## Trust Signals

Every subject in every domain resolves to one of five states:

| Signal | Meaning | Agent Action |
|---|---|---|
| `TRUSTED` | Clean behavioral profile | Proceed — execution allowed |
| `REVOKED` | Flagged activity | Reject — execution denied |
| `PENDING` | Inconclusive evidence | Review before acting |
| `UNSEEN` | No evidence collected yet | Build signal first |
| `LAPSED` | Signal is stale | Re-evaluate before acting |

These are not scores. They are bounded, actionable states with explicit semantics. No interpretation required.

---

## Trust Domains

Two domains are deployed and active on Ritual testnet.

### `counterparty_trust.ritual_trade_v1`

*Should an autonomous system coordinate with this counterparty?*

Evaluates wallet behavioral history — transaction count, failure rate, unbounded approvals, and flagged interaction patterns. High activity with a clean posture yields `TRUSTED`. Flagged interactions yield `REVOKED`.

Evidence features: `tx_count` · `failed_tx` · `unique_counterparties` · `unbounded_approvals` · `flagged_interactions`

---

### `agent_safety.ritual_infernet_v1`

*Should this agent be allowed to operate independently?*

Evaluates agent operational safety — unauthorized action attempts, anomaly score trend, and model configuration changes. A stable agent with no unauthorized attempts yields `TRUSTED`. Any unauthorized action or anomaly above threshold yields `REVOKED`.

Evidence features: `action_count` · `failed_actions` · `unauthorized_attempts` · `model_changes` · `anomaly_score`

---

## Protocol Objects

Every trust signal produces a chain of four artifacts:

**SignalObject** — The evidence artifact. Observation window, derived feature values, and a Merkle root committing the full evidence set. Fully reproducible: given the same subject, domain, and block window, anyone can rebuild and verify.

**ReadingArtifact** — The intermediate assessment. Result of evaluating the SignalObject against domain policy before submission. Used for preview and local verification.

**VerdictObject** — The onchain judgment. Stored in `OmenJudgment` with full revision history. Every re-evaluation increments the revision counter. Permanently queryable.

**OmenRegistry entry** — The compact mirror. A single mapping from `(subject, domain) → trust signal` that downstream systems read on the hot path. One call returns the signal, freshness status, and handshake decision.

---

## Architecture
┌─────────────────────────────────────┐
                │           Next.js Frontend           │
                │  Protocol · Builder · Check · Agents │
                │        Demo · Architecture           │
                └────────────────┬────────────────────┘
                                 │ fetch
                          ┌──────┴──────┐
                          │   API Routes │
                          │  (Next.js)   │
                          └──────┬──────┘
                ┌────────────────┼─────────────────────┐
                │                                       │
         Evidence Layer                       Ritual Chain (1979)
         buildSignal()                                  │
         evaluate()                    ┌────────────────┴────────────────┐
                │                      │                                 │
         User Wallet ──────────► OmenJudgment                    OmenRegistry
         (wagmi +                (evidence +                     (compact mirror,
          sendTransaction)        revisioned                      hot-path reads)
                                  signals)
                                        │
                           ┌────────────┴────────────┐
                           │                         │
                    OmenAgentAware             OmenAgentDirect
                    (queries registry          (no trust check,
                     before acting —            benchmark baseline)
                     TRUST-AWARE AGENT)
                            │
                ┌───────────┴───────────┐
                │                       │
         TRUSTED signal          REVOKED signal
                │                       │
       Execution Allowed         Execution Denied

       ---

## Contracts on Ritual Testnet

| Contract | Address | Role | Status |
|---|---|---|---|
| `OmenJudgment` | `0xc32a1e26e77664753b4A54a4312dF0a8159147D0` | Evidence intake, signal issuance, revision history | ✓ Verified |
| `OmenRegistry` | `0xCbB34EB8651dc8f1d65a20165C1166C13f626620` | Compact mirror for hot-path consumption | ✓ Verified |
| `OmenAgentAware` | `0x5690BafF48F41F4C646D5c1DF59ADdeB8BB0a295` | Trust-aware agent — queries registry before acting | ✓ Verified |
| `OmenAgentDirect` | `0x7040235955B2D397d7CB717a300911Ec68644aFe` | Direct-action comparison agent — no trust check | ✓ Verified |
| `OmenJudgmentLLM` | `0x4d6f86B615e4B793B43BCd9868D0E3cBD7b64947` | LLM precompile (0x0802) — TEE-attested signals via GLM-4.7-FP8 | ✓ Verified |
| `OmenSovereignAgent` | `0x3260dDe013d8c5130092B3DFB7d44DdD995da528` | Autonomous agent — auto-refreshes signals every 500 blocks | ✓ Verified |

Explorer: [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)

---

## Pre-seeded Demo Subjects

| Address | Domain | Trust Signal |
|---|---|---|
| `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001` | `counterparty_trust.ritual_trade_v1` | `TRUSTED` |
| `0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c` | `counterparty_trust.ritual_trade_v1` | `REVOKED` |
| `0x0000000000000000000000000000000000000b0b` | `agent_safety.ritual_infernet_v1` | `TRUSTED` |

---

## Running Locally

```bash
# 1. Clone and install
git clone https://github.com/Richardweb1/omen
cd omen
npm install

# 2. Configure environment
cp .env.example .env
# Fill in PRIVATE_KEY, RITUAL_RPC_URL, contract addresses

# 3. Compile contracts
npx hardhat compile

# 4. Deploy to Ritual
npx hardhat run scripts/deploy.ts --network ritual

# 5. Start the frontend
cd web
npm install
npm run dev
```

Open `http://localhost:3000`, connect your wallet, go to the Trust Signal Builder, and run through all four steps. Both transactions are signed by your connected wallet — Omen never uses a backend wallet to pay gas.

---

## Project Structure

omen/
├── contracts/
│   ├── OmenJudgment.sol        # Core: evidence intake, signal issuance, revision history
│   ├── OmenRegistry.sol        # Mirror: cheap hot-path trust signal reads
│   ├── OmenAgentAware.sol      # Trust-aware agent: queries registry before acting
│   ├── OmenAgentDirect.sol     # Baseline agent: no trust check
│   ├── OmenJudgmentLLM.sol     # LLM precompile integration: TEE-attested signals
│   └── OmenSovereignAgent.sol  # Autonomous agent: auto-refreshes every 500 blocks
├── scripts/
│   ├── deploy.ts               # Deploy all contracts, save addresses
│   ├── deployAgent.ts          # Deploy OmenSovereignAgent
│   ├── startAgent.ts           # Start sovereign agent scheduler
│   └── checkWallet.ts          # Check RitualWallet balance
├── web/
│   └── app/
│       ├── page.tsx            # Protocol homepage
│       ├── builder/            # Trust Signal Builder — 4-step evidence flow
│       ├── check/              # Trust Signal Check — look up any address
│       ├── agents/             # Agent & Trust Monitor — live agent heartbeat
│       └── demo/               # Demo Lab — benchmarks + agent execution simulator
├── hardhat.config.ts           # Ritual chain config (chain ID 1979)
├── deployments.json            # Generated on deploy
└── .env.example

---

## What Makes Omen Different

**Scores** tell you a number. **Blacklists** tell you a boolean. Omen tells you a bounded, inspectable trust signal — what evidence was observed, what domain policy was applied, what signal was reached, and what the agent should do next.

**The evidence is reproducible.** The same subject, domain, and block window always produces the same Merkle root. Anyone can verify independently.

**The signals are bounded.** Five states. Five actions. No interpretation required.

**The consumption is cheap.** OmenRegistry is a read-optimized mirror. One mapping lookup on the hot path.

**The execution is trust-aware.** OmenAgentAware doesn't just read the signal — it acts on it. TRUSTED means proceed. REVOKED means reject. Automatically. Verifiably. Onchain.

---

## Connection to Ritual's Vision

Ritual is building infrastructure for intelligent onchain systems — agents that observe, decide, and act autonomously. Omen is the trust substrate that makes those systems safe to compose.

When two Ritual agents want to coordinate, they need a shared answer to whether the counterparty can be trusted. Omen provides that answer in a form both agents can verify independently. When a human wants to audit what an agent decided and why, Omen provides the evidence trail.

Omen uses all three of Ritual's core precompiles:
- **HTTP precompile (0x0801)** — for external data fetching
- **LLM precompile (0x0802)** — for TEE-attested AI evaluation via GLM-4.7-FP8
- **Scheduler precompile (0x080C)** — for autonomous agent wake cycles every 500 blocks

---

## Phases

- **Phase 1 ✓** — Deterministic trust signals, 4 contracts, full Next.js frontend
- **Phase 2 ✓** — LLM precompile (0x0802), GLM-4.7-FP8 in TEE, attested signals
- **Phase 3 ✓** — Scheduler precompile, OmenSovereignAgent, auto-refresh every 500 blocks
- **Phase 4** — Sovereign Agent (0x080C) deep wallet audit on demand
- **Phase 5** — Persistent Agent (0x0820) always-on trust guardian

---

## What's Next

- **Agent-to-agent verification** — any agent contract address can be a subject in OmenRegistry, enabling trust mesh between autonomous systems
- **Agent Mesh domain** — `agent_mesh.ritual_infernet_v1` for agent-to-agent trust checks
- **Audit page** — live TEE proof inspection once OmenAuditGateway is funded
- **Persistent Agent** — always-on guardian using 0x0820 precompile

---

*Trust Infrastructure For Autonomous Systems · Built on Ritual Chain · Chain ID 1979 · Block time ~350ms*

