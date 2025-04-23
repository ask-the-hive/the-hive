import { ethers } from "ethers";

// BASE mainnet RPC URL
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

let provider: ethers.JsonRpcProvider | null = null;

export function getBaseProvider(): ethers.JsonRpcProvider {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    }
    return provider;
}

export function resetBaseProvider() {
    provider = null;
} 