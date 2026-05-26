import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

 async function main() {
  const subject     = process.env["OMEN_SUBJECT"]   ?? "";
  const domain      = process.env["OMEN_DOMAIN"]    ?? "";
  const featuresRaw = process.env["OMEN_FEATURES"]  ?? "[]";
  const reasoning   = process.env["OMEN_REASONING"] ?? "";

  process.stderr.write(`subject: ${subject}\ndomain: ${domain}\nfeatures: ${featuresRaw}\n`);

  if (!subject || !domain) throw new Error("OMEN_SUBJECT and OMEN_DOMAIN required");

  const features = JSON.parse(featuresRaw);
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../deployments.json"), "utf8")
  );

  const judgment = await ethers.getContractAt("OmenJudgment", deployments.contracts.OmenJudgment);
  const block = await ethers.provider.getBlockNumber();
  const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes(`omen-signal-${subject}-${domain}-${block}`));

  const tx1 = await judgment.submitSignal(subject, domain, merkleRoot, block - 1000, block);
  const r1  = await tx1.wait();

  const tx2 = await judgment.evaluateDeterministic(subject, domain, features, reasoning);
  const r2  = await tx2.wait();

  process.stdout.write(JSON.stringify({
    success: true, subject, domain,
    transactions: {
      submitSignal:    { hash: r1?.hash, block: r1?.blockNumber },
      evaluateVerdict: { hash: r2?.hash, block: r2?.blockNumber },
    },
  }) + "\n");
}

main().catch(e => {
  process.stdout.write(JSON.stringify({ success: false, error: e.message }) + "\n");
  process.exit(1);
});