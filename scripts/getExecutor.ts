import { ethers } from "hardhat";

const TEE_REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";

async function main() {
  const provider = ethers.provider;

  // Use low-level call to decode raw data
  const iface = new ethers.Interface([
    "function getServicesByCapability(uint8 capability, bool activeOnly) external view returns (bytes)"
  ]);

  const data = iface.encodeFunctionData("getServicesByCapability", [1, true]);
  const result = await provider.call({ to: TEE_REGISTRY, data });

  console.log("Raw result length:", result.length);
  console.log("Raw result:", result.slice(0, 200));

  // Try to extract executor address from raw bytes
  // The executor address appears at offset after decoding
  const hex = result.slice(2);
  // Look for addresses in the data
  const addresses: string[] = [];
  for (let i = 0; i < hex.length - 40; i += 64) {
    const chunk = hex.slice(i, i + 64);
    if (chunk.startsWith("000000000000000000000000")) {
      const addr = "0x" + chunk.slice(24);
      if (addr !== "0x0000000000000000000000000000000000000000") {
        addresses.push(addr);
      }
    }
  }
  console.log("Potential addresses found:", addresses.slice(0, 5));
}

main().catch(console.error);