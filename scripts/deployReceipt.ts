import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const REGISTRY_ADDRESS = "0xCbB34EB8651dc8f1d65a20165C1166C13f626620";
const RITUAL_CHAIN_ID = 1979;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Omen — Deploying Trust Receipt NFT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Registry : ${REGISTRY_ADDRESS}`);

  const Receipt = await ethers.getContractFactory("OmenTrustReceipt");
  const receipt = await Receipt.deploy(REGISTRY_ADDRESS, RITUAL_CHAIN_ID);
  const deploymentTx = receipt.deploymentTransaction();
  await receipt.waitForDeployment();
  const receiptAddr = await receipt.getAddress();

  console.log(`  Receipt  : ${receiptAddr}`);
  if (deploymentTx) console.log(`  Tx Hash  : ${deploymentTx.hash}`);

  const deploymentsPath = path.join(__dirname, "../deployments.json");
  const deployments = fs.existsSync(deploymentsPath)
    ? JSON.parse(fs.readFileSync(deploymentsPath, "utf8"))
    : {
        network: "ritual",
        chainId: RITUAL_CHAIN_ID,
        contracts: {},
      };

  deployments.network = "ritual";
  deployments.chainId = RITUAL_CHAIN_ID;
  deployments.updatedAt = new Date().toISOString();
  deployments.contracts = {
    ...deployments.contracts,
    OmenTrustReceipt: receiptAddr,
  };
  deployments.transactions = {
    ...deployments.transactions,
    OmenTrustReceipt: deploymentTx?.hash,
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Receipt deployment complete — deployments.json updated");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
