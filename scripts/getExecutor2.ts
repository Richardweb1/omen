import { ethers } from "hardhat";

const TEE_REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";

async function main() {
  const provider = ethers.provider;
  
  // Call with raw data and decode manually
  const calldata = "0x" + Buffer.from(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint8", "bool"],
      [1, true]
    ).slice(2), "hex"
  ).toString("hex");

  // Use the correct function selector
  const iface = new ethers.Interface([
    "function getServicesByCapability(uint8,bool) view returns (bytes[])"
  ]);
  
  const data = iface.encodeFunctionData("getServicesByCapability", [1, true]);
  
  try {
    const result = await provider.call({ to: TEE_REGISTRY, data });
    console.log("Result length:", result.length);
    
    // Extract all 20-byte addresses from the result
    const hex = result.slice(2);
    const found = new Set<string>();
    for (let i = 0; i <= hex.length - 40; i += 2) {
      const chunk = hex.slice(i, i + 64);
      if (chunk && chunk.startsWith("000000000000000000000000") && !chunk.endsWith("0000000000000000000000000000000000000000")) {
        const addr = ethers.getAddress("0x" + chunk.slice(24));
        if (addr !== "0x0000000000000000000000000000000000000000") {
          found.add(addr);
        }
      }
    }
    console.log("Addresses found:");
    found.forEach(a => console.log(" ", a));
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}

main().catch(console.error);