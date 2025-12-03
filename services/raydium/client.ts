import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { Connection, PublicKey } from '@solana/web3.js';

// Helper function to load Raydium with error handling and retry
const loadRaydiumSafely = async (config: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await Raydium.load(config);
    } catch (error: any) {
      // Log network errors but still throw them to avoid type compatibility issues
      if (
        error?.message?.includes('Network Error') ||
        error?.message?.includes('GET https://tokens.jup.ag/tokens') ||
        error?.code === 'NETWORK_ERROR'
      ) {
        console.warn(`Raydium SDK network error (attempt ${i + 1}/${retries}):`, error.message);

        // If this is the last attempt, throw the error
        if (i === retries - 1) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      // For non-network errors, throw immediately
      throw error;
    }
  }
};

// Lazy load Raydium to avoid initialization errors on app startup
let raydiumApiClientInstance: Promise<any> | null = null;
let raydiumTransactionClientInstance: Promise<any> | null = null;

export const raydiumApiClient = async () => {
  if (!raydiumApiClientInstance) {
    raydiumApiClientInstance = loadRaydiumSafely({
      connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!),
    });
  }
  return raydiumApiClientInstance;
};

export const raydiumTransactionClient = async (address: string) => {
  if (!raydiumTransactionClientInstance) {
    raydiumTransactionClientInstance = loadRaydiumSafely({
      connection: new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }),
      owner: new PublicKey(address),
      disableFeatureCheck: true,
      blockhashCommitment: 'confirmed',
    });
  }
  return raydiumTransactionClientInstance;
};
