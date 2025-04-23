import { getTokenPairs } from "@/services/moralis";
import { getToken, getTokenBySymbol } from "@/db/services";
import { searchTokens } from "@/services/birdeye";

import type { GetPoolsArgumentsType, GetPoolsResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";

/**
 * Gets the liquidity pools for a Base token.
 *
 * @param args - The input arguments for the action
 * @returns A message containing the token pools data
 */
export async function getPools(args: GetPoolsArgumentsType): Promise<BaseActionResult<GetPoolsResultBodyType>> {
  console.log(`[Base Liquidity] Getting pools with args:`, args);
  
  try {
    if (args.address) {
      console.log(`[Base Liquidity] Getting token by address: ${args.address}`);
      const token = await getToken(args.address);
      console.log(`[Base Liquidity] Token found:`, token);
      
      if (!token) throw new Error('No token data found');
      
      console.log(`[Base Liquidity] Getting token pairs for address: ${args.address}`);
      const pairs = await getTokenPairs(args.address, 'base');
      console.log(`[Base Liquidity] Pairs found: ${pairs.length}`);
      
      return {
        body: {
          pools: pairs
        },
        message: `Found pools for ${args.address}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
      };
    } else if (args.ticker) {
      console.log(`[Base Liquidity] Getting token by ticker: ${args.ticker}`);
      
      // Search for the token using Birdeye
      console.log(`[Base Liquidity] Searching for token with Birdeye: ${args.ticker}`);
      try {
        const searchResult = await searchTokens({
          keyword: args.ticker,
          target: "token",
          sort_by: "volume_24h_usd",
          sort_type: "desc",
          offset: 0,
          limit: 10,
          chain: 'base'
        });
        
        const token = searchResult?.items?.[0]?.result?.[0];
        
        if (token) {
          console.log(`[Base Liquidity] Found token via Birdeye search: ${token.name} (${token.symbol}) with address: ${token.address}`);
          
          console.log(`[Base Liquidity] Getting token pairs for address: ${token.address}`);
          const pairs = await getTokenPairs(token.address, 'base');
          console.log(`[Base Liquidity] Pairs found: ${pairs.length}`);
          
          return {
            body: {
              pools: pairs
            },
            message: `Found pools for ${token.name} (${token.symbol}). The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
          };
        } else {
          console.log(`[Base Liquidity] No token found via Birdeye search for: ${args.ticker}`);
        }
      } catch (searchError) {
        console.error(`[Base Liquidity] Error searching for token with Birdeye:`, searchError);
      }
      
      // Try to get from database as fallback
      try {
        const token = await getTokenBySymbol(args.ticker);
        console.log(`[Base Liquidity] Token found in database:`, token);
        
        if (token) {
          console.log(`[Base Liquidity] Getting token pairs for address: ${token.id}`);
          const pairs = await getTokenPairs(token.id, 'base');
          console.log(`[Base Liquidity] Pairs found: ${pairs.length}`);
          
          return {
            body: {
              pools: pairs
            },
            message: `Found pools for ${args.ticker}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
          };
        }
      } catch (dbError) {
        console.error(`[Base Liquidity] Error getting token from database:`, dbError);
      }
      
      // If we get here, we couldn't find the token
      throw new Error(`No token data found for ${args.ticker}`);
    } else {
      throw new Error('Invalid input');
    }
  } catch (error) {
    console.error(`[Base Liquidity] Error getting pools:`, error);
    return {
      message: `Error getting pools: ${error}`,
    };
  }
} 