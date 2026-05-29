import { ethers } from "hardhat";

const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";

async function main() {
  const [signer] = await ethers.getSigners();
  
  const wallet = new ethers.Contract(RITUAL_WALLET, [
    "function balanceOf(address user) external view returns (uint256)",
    "function lockUntil(address user) external view returns (uint256)",
    "function withdraw(uint256 amount) external",
  ], signer);

  const balance = await wallet.balanceOf(signer.address);
  const lockUntil = await wallet.lockUntil(signer.address);
  const currentBlock = await ethers.provider.getBlockNumber();

  console.log("RitualWallet balance:", ethers.formatEther(balance), "RITUAL");
  console.log("Lock until block:", lockUntil.toString());
  console.log("Current block:", currentBlock);
  console.log("Lock expired:", currentBlock > Number(lockUntil) ? "YES ✓" : "NO — wait more blocks");
// Withdraw
  console.log("\nWithdrawing...");
  const withdrawTx = await wallet.withdraw(balance);
  await withdrawTx.wait();
  const newBalance = await ethers.provider.getBalance(signer.address);
  console.log("✓ Withdrawn! New wallet balance:", ethers.formatEther(newBalance), "RITUAL");
}

main().catch(console.error);