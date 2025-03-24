import fetch from 'node-fetch';

interface MoralisPairResponse {
  cursor: string;
  page_size: number;
  page: number;
  pairs: MoralisPair[];
}

export interface MoralisPair {
  exchange_address: string;
  exchange_name: string | null;
  exchange_logo: string | null;
  pair_label: string;
  pair_address: string;
  usd_price: number;
  usd_price_24hr: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  liquidity_usd: number;
  inactive_pair: boolean;
  base_token: string;
  quote_token: string;
  volume_24h_native: number;
  volume_24h_usd: number;
  pair: [TokenInfo, TokenInfo];
}

export interface TokenInfo {
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_logo: string;
  token_decimals: string;
  pair_token_type: string;
  liquidity_usd: number;
}

/**
 * Get token pairs for a given token address on BSC
 * @param tokenAddress The address of the token to get pairs for
 * @returns An array of token pairs
 */
export async function getTokenPairs(tokenAddress: string): Promise<MoralisPair[]> {
  console.log(`[Moralis] Getting token pairs for address: ${tokenAddress}`);
  console.log(`[Moralis] API Key exists: ${!!process.env.MORALIS_API_KEY}`);
  
  try {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY || ''
      },
    };

    console.log(`[Moralis] Making API request to: https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/pairs?chain=bsc`);
    
    const response = await fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/pairs?chain=bsc`, options);
    
    console.log(`[Moralis] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token pairs: ${response.statusText}`);
    }

    const data = await response.json() as MoralisPairResponse;
    
    console.log(`[Moralis] Response data received. Pairs count: ${data.pairs?.length || 0}`);
    
    // Extract unique pairs
    const uniquePairs = data.pairs.reduce((acc: MoralisPair[], pair: MoralisPair) => {
      // Check if we already have this pair (by pair_address)
      const existingPair = acc.find((p) => p.pair_address === pair.pair_address);
      if (!existingPair) {
        acc.push(pair);
      }
      return acc;
    }, []);

    console.log(`[Moralis] Unique pairs count: ${uniquePairs.length}`);
    
    return uniquePairs;
  } catch (error) {
    console.error('[Moralis] Error fetching token pairs:', error);
    throw error;
  }
} 