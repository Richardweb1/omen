import { ethers } from "hardhat";

const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";

async function main() {
  const [signer] = await ethers.getSigners();
  const ritualWallet = new ethers.Contract(RITUAL_WALLET, [
    "function deposit(uint256 lockDuration) external payable",
    "function balanceOf(address user) external view returns (uint256)",
  ], signer);

  console.log("Depositing 0.35 RITUAL for EOA...");
  const tx = await ritualWallet.deposit(5000, { value: ethers.parseEther("0.35") });
  await tx.wait();
  const balance = await ritualWallet.balanceOf(signer.address);
  console.log("✓ EOA RitualWallet balance:", ethers.formatEther(balance), "RITUAL");
}

main().catch(console.error);