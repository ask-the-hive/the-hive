import { ChainType } from "@/app/_contexts/chain-context";

interface TokenHoldersResponse {
  totalHolders: number;
  page: number;
  page_size: number;
  cursor: string | null;
  result: any[];
}

/**
 * Gets the number of holders for a BSC or Base token using Moralis API
 * @param address The token contract address
 * @param chain The chain to get holders for (bsc or base)
 * @returns The total number of token holders
 */
export async function getTokenHolders(address: string, chain: ChainType = 'bsc'): Promise<number> {
  try {
    // Map chain to Moralis chain ID
    const moralisChain = chain === 'bsc' ? 'bsc' : 'base';
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/holders?chain=${moralisChain}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
    }

    const data: TokenHoldersResponse = await response.json();
    return data.totalHolders;
  } catch (error) {
    console.error('Error fetching token holders:', error);
    throw error;
  }
} 