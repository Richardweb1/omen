import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  const llmAddress = deployments.contracts.OmenJudgmentLLM;
  const llm = await ethers.getContractAt("OmenJudgmentLLM", llmAddress);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Testing OmenJudgmentLLM");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance: ${ethers.formatEther(balance)} RITUAL`);

  // Step 1 — deposit fees
  console.log("\nDepositing 0.1 RITUAL for LLM fees...");
  const depositTx = await llm.depositFees({ value: ethers.parseEther("0.1") });
  await depositTx.wait();
  console.log("✓ Deposited");

  // Step 2 — call LLM evaluation
  const subject  = "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001";
  const domain   = "counterparty_trust.ritual_trade_v1";
  const features = [68, 7, 17, 2, 0];
  const reasoning = "Clean activity profile";

  console.log("\nCalling evaluateWithLLM...");
  const tx = await llm.evaluateWithLLM(
    subject, domain, features, reasoning,
    { gasLimit: 5000000 }
  );
  console.log(`  tx hash: ${tx.hash}`);
  console.log("  Waiting for settlement (may take 30-60 seconds)...");
  const receipt = await tx.wait();
  console.log(`  block: ${receipt?.blockNumber}`);

  // Step 3 — read verdict
  const verdict = await llm.getVerdict(subject, domain);
  console.log("\n  Result:");
  console.log(`  Verdict     : ${["UNSEEN","SEALED","PENDING","REVOKED","LAPSED"][verdict[0]]}`);
  console.log(`  Reasoning   : ${verdict[3]}`);
  console.log(`  Attestation : ${verdict[4]}`);
  console.log(`  LLM Used    : ${verdict[5]}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(console.error);