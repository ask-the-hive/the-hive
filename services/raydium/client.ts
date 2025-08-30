import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Connection, PublicKey } from "@solana/web3.js";

// Helper function to load Raydium with error handling
const loadRaydiumSafely = (config: any) => {
    try {
        return Raydium.load(config);
    } catch (error: any) {
        // Log network errors but still throw them to avoid type compatibility issues
        if (error?.message?.includes('Network Error') || 
            error?.message?.includes('GET https://tokens.jup.ag/tokens') ||
            error?.code === 'NETWORK_ERROR') {
            console.warn('Raydium SDK network error:', error.message);
        }
        // Always throw the error to maintain type safety
        throw error;
    }
};

export const raydiumApiClient = loadRaydiumSafely({
    connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
})

export const raydiumTransactionClient = async (address: string) => loadRaydiumSafely({
    connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    }),
    owner: new PublicKey(address),
    disableFeatureCheck: true,
    blockhashCommitment: 'confirmed',
})