import { ethers } from "hardhat";

const LLM_PRECOMPILE = "0x0000000000000000000000000000000000000802";
const RITUAL_WALLET  = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
const EXECUTOR       = "0xDbd91ABbc81e62ec68C6eE335426210b3A54f8Ff";

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "RITUAL");

  // Step 1 — deposit to RitualWallet
  console.log("\nDepositing 0.32 RITUAL to RitualWallet...");
  const ritualWallet = new ethers.Contract(RITUAL_WALLET, [
    "function deposit(uint256 lockDuration) external payable",
    "function balanceOf(address user) external view returns (uint256)",
  ], signer);

  const depositTx = await ritualWallet.deposit(5000, { value: ethers.parseEther("0.32") });
  await depositTx.wait();
  const walletBalance = await ritualWallet.balanceOf(signer.address);
  console.log("✓ RitualWallet balance:", ethers.formatEther(walletBalance), "RITUAL");

  // Step 2 — call LLM precompile
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
  console.log("Waiting for settlement...");
  const receipt = await tx.wait();
  console.log("Status:", receipt?.status === 1 ? "✓ Success" : "✗ Failed");
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log("Logs:", receipt?.logs.length);

  if (receipt?.logs && receipt.logs.length > 0) {
    console.log("\nLLM responded! Logs:");
    receipt.logs.forEach((log, i) => {
      console.log(`Log ${i}:`, log.data.slice(0, 200));
    });
  }
}

main().catch(console.error);