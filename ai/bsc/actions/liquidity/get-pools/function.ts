import { getTokenPairs } from "@/services/moralis";
import { getToken, getTokenBySymbol } from "@/db/services";
import { searchTokens } from "@/services/birdeye";

import type { GetPoolsArgumentsType, GetPoolsResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

/**
 * Gets the liquidity pools for a BSC token.
 *
 * @param args - The input arguments for the action
 * @returns A message containing the token pools data
 */
export async function getPools(args: GetPoolsArgumentsType): Promise<BscActionResult<GetPoolsResultBodyType>> {
  try {
    if (args.address) {
      const token = await getToken(args.address);
      
      if (!token) throw new Error('No token data found');
      
      const pairs = await getTokenPairs(args.address);
      
      return {
        body: {
          pools: pairs
        },
        message: `Found pools for ${args.address}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
      };
    } else if (args.ticker) {
      // Search for the token using Birdeye
      try {
        const searchResult = await searchTokens({
          keyword: args.ticker,
          target: "token",
          sort_by: "volume_24h_usd",
          sort_type: "desc",
          offset: 0,
          limit: 10,
          chain: 'bsc'
        });
        
        const token = searchResult?.items?.[0]?.result?.[0];
        
        if (token) {
          // Validate that the token address is a valid Ethereum hex address
          if (!/^0x[a-fA-F0-9]{40}$/.test(token.address)) {
            console.error(`[BSC Liquidity] Invalid token address format: ${token.address} (expected Ethereum hex address)`);
            throw new Error(`Invalid token address format: ${token.address}`);
          }
          
          // Validate that the token is actually from BSC chain
          if (token.network !== 'bsc') {
            console.error(`[BSC Liquidity] Token is from wrong network: ${token.network} (expected 'bsc')`);
            throw new Error(`Token is from wrong network: ${token.network} (expected 'bsc')`);
          }
          
          const pairs = await getTokenPairs(token.address);
          
          return {
            body: {
              pools: pairs
            },
            message: `Found pools for ${token.name} (${token.symbol}). The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
          };
        }
      } catch (searchError) {
        console.error(`[BSC Liquidity] Error searching for token with Birdeye:`, searchError);
      }
      
      // Try to get from database as fallback
      try {
        const token = await getTokenBySymbol(args.ticker);
        
        if (token) {
          const pairs = await getTokenPairs(token.id);
          
          return {
            body: {
              pools: pairs
            },
            message: `Found pools for ${args.ticker}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
          };
        }
      } catch (dbError) {
        console.error(`[BSC Liquidity] Error getting token from database:`, dbError);
      }
      
      // If we get here, we couldn't find the token
      throw new Error(`No token data found for ${args.ticker}`);
    } else {
      throw new Error('Invalid input');
    }
  } catch (error) {
    console.error(`[BSC Liquidity] Error getting pools:`, error);
    return {
      message: `Error getting pools: ${error}`,
    };
  }
} 