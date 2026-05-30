import { ethers } from 'hardhat';
const OLD_AUDIT = '0x039B66ce1C2C643Ac328f155E0517be9FB9914bd';
async function main() {
  const [signer] = await ethers.getSigners();
  const old = new ethers.Contract(OLD_AUDIT, [
    'function withdrawRitualWallet(uint256 amount) external',
  ], signer);
  console.log('Withdrawing 0.35 RITUAL from old contract RitualWallet...');
  const tx = await old.withdrawRitualWallet(ethers.parseEther('0.35'), { gasLimit: 100000 });
  await tx.wait();
  console.log('Done! Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)));
}
main().catch(console.error);
