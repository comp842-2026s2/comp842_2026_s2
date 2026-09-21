import { network } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Grab the contract factory
  const EduChainCredential =
    await ethers.getContractFactory("EduChainCredential");

  // Deploy it to the network
  const credentialContract = await EduChainCredential.deploy(deployer.address);
  await credentialContract.waitForDeployment();

  console.log(
    `EduChainCredential successfully deployed to: ${credentialContract.target}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
