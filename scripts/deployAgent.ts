import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen Protocol — Deploying OmenSovereignAgent");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} RITUAL\n`);

  const Agent = await ethers.getContractFactory("OmenSovereignAgent");
  const agent = await Agent.deploy(
    deployments.contracts.OmenJudgment,
    deployments.contracts.OmenRegistry
  );
  await agent.waitForDeployment();
  const agentAddr = await agent.getAddress();
  console.log(`✓ OmenSovereignAgent: ${agentAddr}\n`);

  deployments.contracts.OmenSovereignAgent = agentAddr;
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deployments, null, 2)
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OmenSovereignAgent → ${agentAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});