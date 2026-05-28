import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen Protocol — Deploying OmenJudgmentLLM");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} RITUAL\n`);

  console.log("Deploying OmenJudgmentLLM...");
  const LLM = await ethers.getContractFactory("OmenJudgmentLLM");
  const EXECUTOR = "0xeC6a6C7ebd08616C805e18cDeA6bF9C54950C77D";
  const llm = await LLM.deploy(deployments.contracts.OmenRegistry, EXECUTOR);
  await llm.waitForDeployment();
  const llmAddr = await llm.getAddress();
  console.log(`✓ OmenJudgmentLLM: ${llmAddr}\n`);

  // Save to deployments
  deployments.contracts.OmenJudgmentLLM = llmAddr;
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deployments, null, 2)
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OmenJudgmentLLM deployed → ${llmAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});