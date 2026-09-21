import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

// Explicitly load the variables
dotenv.config();

const { API_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.28",
  defaultNetwork: "sepolia",
  plugins: [hardhatEthers],
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    sepolia: {
      type: "http",
      url: API_URL,
      // Format the private key exactly as Hardhat expects
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
};

export default config;
