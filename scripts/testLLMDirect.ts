import { ethers } from "hardhat";

const LLM_PRECOMPILE = "0x0000000000000000000000000000000000000802";
const EXECUTOR       = "0xDbd91ABbc81e62ec68C6eE335426210b3A54f8Ff";

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "RITUAL");

  // Deposit more to reach 0.311 minimum
  console.log("Depositing 0.22 RITUAL to RitualWallet...");
  const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
  const ritualWallet = new ethers.Contract(RITUAL_WALLET, [
    "function deposit(uint256 lockDuration) external payable",
  ], signer);
  const depositTx = await ritualWallet.deposit(5000, { value: ethers.parseEther("0.22") });
  await depositTx.wait();
  console.log("✓ Deposited");

  const messagesJson = JSON.stringify([
    { role: "user", content: "Reply with exactly one word: SEALED" }
  ]);

  const input = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes[]", "uint256", "bytes[]", "bytes",
     "string", "string", "int256", "string", "bool", "int256", "string", "string",
     "uint256", "bool", "int256", "string", "bytes", "int256", "string", "string", "bool",
     "int256", "bytes", "bytes", "int256", "int256", "string", "bool",
     "tuple(string,string,string)"],
    [
      EXECUTOR, [], 300n, [], "0x",
      messagesJson,
      "zai-org/GLM-4.7-FP8",
      0n, "", false, 4096n, "", "",
      1n, true, 0n, "medium", "0x", -1n, "auto", "",
      false,
      700n, "0x", "0x", -1n, 1000n, "",
      false,
      ["", "", ""]
    ]
  );

  console.log("\nCalling LLM precompile...");
  const tx = await signer.sendTransaction({
    to: LLM_PRECOMPILE,
    data: input,
    gasLimit: 5000000,
  });
  console.log("tx hash:", tx.hash);
  console.log("Waiting...");
  const receipt = await tx.wait();
  console.log("Status:", receipt?.status === 1 ? "✓ Success" : "✗ Failed");
  console.log("Gas used:", receipt?.gasUsed.toString());
}

main().catch(console.error);