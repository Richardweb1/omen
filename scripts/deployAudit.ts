import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen Protocol — Deploying OmenAuditGateway");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} RITUAL\n`);

  const EXECUTOR = "0xDbd91ABbc81e62ec68C6eE335426210b3A54f8Ff";

  const Audit = await ethers.getContractFactory("OmenAuditGateway");
  const audit = await Audit.deploy(EXECUTOR);
  await audit.waitForDeployment();
  const auditAddr = await audit.getAddress();
  console.log(`✓ OmenAuditGateway: ${auditAddr}\n`);

  deployments.contracts.OmenAuditGateway = auditAddr;
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deployments, null, 2)
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  OmenAuditGateway → ${auditAddr}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});