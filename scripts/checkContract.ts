import { ethers } from 'hardhat';
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948';
const AUDIT_CONTRACT = '0x039B66ce1C2C643Ac328f155E0517be9FB9914bd';
async function main() {
  const wallet = new ethers.Contract(RITUAL_WALLET, ['function balanceOf(address) view returns (uint256)','function lockUntil(address) view returns (uint256)'], ethers.provider);
  const balance = await wallet.balanceOf(AUDIT_CONTRACT);
  const lockUntil = await wallet.lockUntil(AUDIT_CONTRACT);
  const block = await ethers.provider.getBlockNumber();
  console.log('Contract balance:', ethers.formatEther(balance), 'RITUAL');
  console.log('Lock until:', lockUntil.toString());
  console.log('Current block:', block);
  console.log('Expired:', block > Number(lockUntil) ? 'YES' : 'NO');
}
main().catch(console.error);
