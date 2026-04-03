const hre = require("hardhat");

async function main() {
  console.log("=== Deploying TrustDrop Suite to Polygon Amoy ===\n");

  // 1. Deploy TrustScore
  console.log("1. Deploying TrustScore...");
  const TrustScore = await hre.ethers.getContractFactory("TrustScore");
  const trustScore = await TrustScore.deploy();
  await trustScore.waitForDeployment();
  const trustScoreAddr = await trustScore.getAddress();
  console.log(`   TrustScore deployed to: ${trustScoreAddr}`);

  // 2. Deploy TrustDropNFT
  console.log("2. Deploying TrustDropNFT...");
  const TrustDropNFT = await hre.ethers.getContractFactory("TrustDropNFT");
  const nft = await TrustDropNFT.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log(`   TrustDropNFT deployed to: ${nftAddr}`);

  // 3. Deploy TrustDrop (main contract with cross-contract refs)
  console.log("3. Deploying TrustDrop (USDC version)...");
  const TrustDrop = await hre.ethers.getContractFactory("TrustDrop");
  const trustDrop = await TrustDrop.deploy(trustScoreAddr, nftAddr);
  await trustDrop.waitForDeployment();
  const trustDropAddr = await trustDrop.getAddress();
  console.log(`   TrustDrop deployed to: ${trustDropAddr}`);

  // 4. Deploy MarketRateOracle
  console.log("4. Deploying MarketRateOracle...");
  const MarketRateOracle = await hre.ethers.getContractFactory("MarketRateOracle");
  const oracle = await MarketRateOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log(`   MarketRateOracle deployed to: ${oracleAddr}`);

  // 5. Transfer ownership of TrustScore and NFT to TrustDrop
  console.log("\n5. Transferring ownership...");
  const tsOwnerTx = await trustScore.transferOwnership(trustDropAddr);
  await tsOwnerTx.wait();
  console.log("   TrustScore ownership → TrustDrop ✓");

  const nftOwnerTx = await nft.transferOwnership(trustDropAddr);
  await nftOwnerTx.wait();
  console.log("   TrustDropNFT ownership → TrustDrop ✓");

  // 6. Seed MarketRateOracle with reference rates
  console.log("\n6. Seeding MarketRateOracle with market rates...");
  const rates = [
    ["Food kit",      150_000000, 220_000000],
    ["Medicine kit",  300_000000, 500_000000],
    ["Transport km",  12_000000,  25_000000],
    ["Notebook set",  80_000000,  150_000000],
    ["Water can",     50_000000,  120_000000],
  ];
  for (const [cat, min, max] of rates) {
    const tx = await oracle.setItemRate(cat, min, max);
    await tx.wait();
    console.log(`   ${cat}: $${min/1_000000} - $${max/1_000000} USDC ✓`);
  }

  // Summary
  console.log("\n=== Deployment Complete! ===");
  console.log(`\nUpdate your .env file:`);
  console.log(`VITE_CONTRACT_ADDRESS=${trustDropAddr}`);
  console.log(`VITE_TRUSTSCORE_ADDRESS=${trustScoreAddr}`);
  console.log(`VITE_NFT_ADDRESS=${nftAddr}`);
  console.log(`VITE_ORACLE_ADDRESS=${oracleAddr}`);
  console.log(`\nNetwork: Polygon Amoy (chainId: 80002)`);
  console.log(`USDC Address: 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
