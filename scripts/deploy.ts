import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen Protocol — Deploying to Ritual chain");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} RITUAL`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("1/4  Deploying OmenRegistry...");
  const Registry = await ethers.getContractFactory("OmenRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`     ✓ OmenRegistry  : ${registryAddr}\n`);

  console.log("2/4  Deploying OmenJudgment...");
  const Judgment = await ethers.getContractFactory("OmenJudgment");
  const judgment = await Judgment.deploy(registryAddr);
  await judgment.waitForDeployment();
  const judgmentAddr = await judgment.getAddress();
  console.log(`     ✓ OmenJudgment  : ${judgmentAddr}\n`);

  console.log("3/4  Wiring registry to judgment...");
  const wireTx = await registry.setJudgment(judgmentAddr);
  await wireTx.wait();
  console.log("     ✓ Registry authorized\n");

  console.log("4/4  Deploying agent contracts...");
  const AgentAware = await ethers.getContractFactory("OmenAgentAware");
  const agentAware = await AgentAware.deploy(registryAddr);
  await agentAware.waitForDeployment();
  const agentAwareAddr = await agentAware.getAddress();
  console.log(`     ✓ OmenAgentAware : ${agentAwareAddr}`);

  const AgentDirect = await ethers.getContractFactory("OmenAgentDirect");
  const agentDirect = await AgentDirect.deploy();
  await agentDirect.waitForDeployment();
  const agentDirectAddr = await agentDirect.getAddress();
  console.log(`     ✓ OmenAgentDirect: ${agentDirectAddr}\n`);

  const addresses = {
    network: "ritual",
    chainId: 1979,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      OmenJudgment:    judgmentAddr,
      OmenRegistry:    registryAddr,
      OmenAgentAware:  agentAwareAddr,
      OmenAgentDirect: agentDirectAddr,
    },
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(addresses, null, 2)
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment complete — addresses saved to deployments.json");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});