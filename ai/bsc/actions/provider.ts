import { ethers } from "ethers";

// BSC Mainnet RPC URL
const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

let provider: ethers.Provider | null = null;

export function getBscProvider(): ethers.Provider {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    }
    return provider;
} 