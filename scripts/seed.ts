import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const DEMO_SUBJECTS = [
  {
    address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
    label:   "Clean Trade Subject",
    domain:  "counterparty_trust.ritual_trade_v1",
    features: [45, 1, 12, 0, 0],
    expectedVerdict: 1,
    reasoning: "High tx count, minimal failures, clean approval posture, no flagged interactions",
  },
  {
    address: "0x3d1539c26aabce1b1aca28fb9d8fd70670391d5c",
    label:   "Risky Trade Subject",
    domain:  "counterparty_trust.ritual_trade_v1",
    features: [8, 3, 2, 7, 1],
    expectedVerdict: 3,
    reasoning: "Flagged interactions detected, unbounded approvals exceed threshold",
  },
  {
    address: "0x0000000000000000000000000000000000000b0b",
    label:   "Agent Safety Subject",
    domain:  "agent_safety.ritual_infernet_v1",
    features: [20, 1, 0, 0, 15],
    expectedVerdict: 1,
    reasoning: "No unauthorized actions, low anomaly score, stable model usage",
  },
];

const VERDICT_NAMES = ["UNSEEN", "SEALED", "PENDING", "REVOKED", "LAPSED"];

async function main() {
  const [deployer] = await ethers.getSigners();

  const deploymentsPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found — run deploy script first");
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { OmenJudgment } = deployments.contracts;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen Protocol — Seeding demo subjects");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const judgment = await ethers.getContractAt("OmenJudgment", OmenJudgment);
  const block    = await ethers.provider.getBlockNumber();

  for (const subject of DEMO_SUBJECTS) {
    console.log(`\n  Seeding: ${subject.label}`);
    console.log(`  Address: ${subject.address}`);

    const merkleRoot = ethers.keccak256(
      ethers.toUtf8Bytes(`omen-signal-${subject.address}-${subject.domain}-${block}`)
    );

    const submitTx = await judgment.submitSignal(
      subject.address,
      subject.domain,
      merkleRoot,
      block - 1000,
      block
    );
    await submitTx.wait();
    console.log("  ✓ Signal submitted");

    const evalTx = await judgment.evaluateDeterministic(
      subject.address,
      subject.domain,
      subject.features,
      subject.reasoning
    );
    await evalTx.wait();
    console.log(`  ✓ Verdict: ${VERDICT_NAMES[subject.expectedVerdict]}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Seed complete — 3 demo subjects ready");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});