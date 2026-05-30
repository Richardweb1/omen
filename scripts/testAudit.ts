import { ethers } from 'hardhat';
async function main() {
  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract('0x039B66ce1C2C643Ac328f155E0517be9FB9914bd', [
    'function requestAudit(address subject, string calldata domain, uint256[] calldata features) external payable returns (uint256 auditId)',
    'function getAudit(uint256 auditId) external view returns (address requester, address subject, string memory domain, uint256 requestedAt, bool completed, string memory report)',
  ], signer);
  console.log('Calling requestAudit...');
  const tx = await contract.requestAudit(
    '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001',
    'counterparty_trust.ritual_trade_v1',
    [68, 7, 17, 2, 0],
    { value: ethers.parseEther('0.01'), gasLimit: 5000000 }
  );
  console.log('tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('status:', receipt?.status);
}
main().catch(console.error);
