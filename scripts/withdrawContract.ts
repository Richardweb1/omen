import { ethers } from 'hardhat';
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948';
const AUDIT_CONTRACT = '0x039B66ce1C2C643Ac328f155E0517be9FB9914bd';
async function main() {
  const [signer] = await ethers.getSigners();
  const audit = new ethers.Contract(AUDIT_CONTRACT, ['function depositFees() external payable', 'function withdraw() external'], signer);
  const rw = new ethers.Contract(RITUAL_WALLET, ['function balanceOf(address) view returns (uint256)'], signer);
  const bal = await rw.balanceOf(AUDIT_CONTRACT);
  console.log('Contract RW balance:', ethers.formatEther(bal));
  console.log('Calling withdraw...');
  const tx = await audit.withdraw({gasLimit: 100000});
  await tx.wait();
  console.log('Done! Wallet:', ethers.formatEther(await ethers.provider.getBalance(signer.address)));
}
main().catch(console.error);
