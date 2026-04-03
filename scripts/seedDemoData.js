const hre = require("hardhat");

async function main() {
  console.log("=== Seeding TrustDrop Demo Data ===\n");

  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.error("ERROR: Set VITE_CONTRACT_ADDRESS in .env first!");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  const TrustDrop = await hre.ethers.getContractFactory("TrustDrop");
  const contract = TrustDrop.attach(contractAddress);

  const now = Math.floor(Date.now() / 1000);
  const DAY = 86400;

  // ============ Campaign 1: Emergency Flood Relief ============
  console.log("1. Creating Emergency Campaign: Vizag Flood Relief 2025...");
  const tx1 = await contract.createCampaign(
    "Vizag Flood Relief 2025 — Emergency Response",
    "[Disaster] Immediate flood relief for 200 families in Bheemunipatnam, Vizag. Providing emergency food kits, transportation, and distribution with QR-verified delivery to every beneficiary.",
    ["Purchase 500 emergency food kits", "Transport to Bheemunipatnam flood zone", "Distribute to 200 families + QR confirmation"],
    [50_000000, 20_000000, 30_000000],
    [now + 7 * DAY, now + 14 * DAY, now + 21 * DAY],
    [0, 0, 200]  // beneficiary counts
  );
  await tx1.wait();
  console.log("   ✓ Campaign 1 created (ID: 0)");

  // Vote emergency on campaign 0
  const isValidator = await contract.isValidator(deployer.address);
  if (!isValidator) {
    console.log("   Registering as validator...");
    const regTx = await contract.registerValidator({ value: hre.ethers.parseEther("0.01") });
    await regTx.wait();
    console.log("   ✓ Registered as validator");
  }

  try {
    const emTx = await contract.voteEmergency(0);
    await emTx.wait();
    console.log("   ✓ Emergency vote 1 cast");
  } catch (e) {
    console.log("   ⚠ Emergency vote skipped:", e.reason || e.message);
  }

  // ============ Campaign 2: Medical Camp ============
  console.log("\n2. Creating Campaign: Street Cause — Rural Medical Camp Vizag...");
  const tx2 = await contract.createCampaign(
    "Street Cause — Rural Medical Camp Vizag",
    "[Medical] Free medical camp targeting 500+ villagers in rural Bheemunipatnam. Includes medicine procurement, camp setup, and doctor consultations with beneficiary tracking.",
    ["Procure medicines and medical equipment", "Setup camp at Bheemunipatnam village", "Conduct camp for 500+ villagers"],
    [40_000000, 20_000000, 40_000000],
    [now + 14 * DAY, now + 21 * DAY, now + 35 * DAY],
    [0, 0, 500]
  );
  await tx2.wait();
  console.log("   ✓ Campaign 2 created (ID: 1)");

  // ============ Campaign 3: Digital Literacy ============
  console.log("\n3. Creating Campaign: Digital Literacy Drive — Govt Schools Vizag...");
  const tx3 = await contract.createCampaign(
    "Digital Literacy Drive — Govt Schools Vizag",
    "[Education] Setting up a computer lab with 10 refurbished laptops in a government school in Vizag, followed by a 4-week digital literacy training program for 200 students.",
    ["Purchase 10 refurbished laptops", "Setup computer lab + inaugural session", "Complete 4-week training for 200 students"],
    [60_000000, 20_000000, 40_000000],
    [now + 10 * DAY, now + 18 * DAY, now + 50 * DAY],
    [0, 0, 200]
  );
  await tx3.wait();
  console.log("   ✓ Campaign 3 created (ID: 2)");

  // Summary
  const count = await contract.getCampaignCount();
  console.log(`\n=== Demo Data Seeded Successfully! ===`);
  console.log(`Total campaigns on-chain: ${count}`);
  console.log(`\nCampaign 0: Vizag Flood Relief (EMERGENCY)`);
  console.log(`Campaign 1: Rural Medical Camp`);
  console.log(`Campaign 2: Digital Literacy Drive`);
  console.log(`\nNote: Campaign 0 needs 1 more emergency vote from`);
  console.log(`a different validator to activate emergency mode.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
