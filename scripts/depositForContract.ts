import { ethers } from "hardhat";

const RITUAL_WALLET   = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
const AUDIT_CONTRACT  = "0x039B66ce1C2C643Ac328f155E0517be9FB9914bd";

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Wallet balance:", ethers.formatEther(balance), "RITUAL");

  const ritualWallet = new ethers.Contract(RITUAL_WALLET, [
    "function depositFor(address user, uint256 lockDuration) external payable",
    "function balanceOf(address user) external view returns (uint256)",
  ], signer);

  // Check contract's current RitualWallet balance
  const contractBalance = await ritualWallet.balanceOf(AUDIT_CONTRACT);
  console.log("Contract RitualWallet balance:", ethers.formatEther(contractBalance), "RITUAL");

  // Deposit for the contract
  console.log("Depositing 0.05 RITUAL for OmenAuditGateway contract...");
  const tx = await ritualWallet.depositFor(AUDIT_CONTRACT, 10000, { value: ethers.parseEther("0.05") });
  await tx.wait();

  const newBalance = await ritualWallet.balanceOf(AUDIT_CONTRACT);
  console.log("✓ Contract RitualWallet balance:", ethers.formatEther(newBalance), "RITUAL");
}

main().catch(console.error);