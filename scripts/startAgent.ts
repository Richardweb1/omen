import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  const agent = await ethers.getContractAt(
    "OmenSovereignAgent",
    deployments.contracts.OmenSovereignAgent
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Starting OmenSovereignAgent");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Step 1 — deposit fees
  console.log("\nDepositing 0.1 RITUAL for execution fees...");
  const depositTx = await agent.depositFees({ value: ethers.parseEther("0.1") });
  await depositTx.wait();
  console.log("✓ Deposited");

  // Step 2 — add subjects
  console.log("\nAdding subjects...");
  const tx1 = await agent.addSubject(
    "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
    "counterparty_trust.ritual_trade_v1",
    [68, 7, 17, 2, 0]
  );
  await tx1.wait();
  console.log("✓ Added subject 1");

  const tx2 = await agent.addSubject(
    "0x0000000000000000000000000000000000000b0b",
    "agent_safety.ritual_infernet_v1",
    [10, 0, 0, 0, 20]
  );
  await tx2.wait();
  console.log("✓ Added subject 2");

  // Step 3 — start agent
  console.log("\nStarting agent — every 500 blocks, 10 executions...");
  const startTx = await agent.startAgent(
    500,      // frequency — every 500 blocks (~2.9 minutes)
    10,       // numCalls — 10 total executions
    500000,   // gasLimit per execution
    { gasLimit: 500000 }
  );
  await startTx.wait();
  console.log("✓ Agent started!");

  const scheduleId = await agent.activeScheduleId();
  console.log(`\n  Schedule ID: ${scheduleId}`);
  console.log(`  Agent address: ${deployments.contracts.OmenSovereignAgent}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});