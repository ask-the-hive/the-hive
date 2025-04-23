import { searchTokens } from "@/services/birdeye";

import type { BaseActionResult } from "../../base-action";
import type { GetTokenAddressArgumentsType, GetTokenAddressResultBodyType } from "./types";

export async function getTokenAddress(args: GetTokenAddressArgumentsType): Promise<BaseActionResult<GetTokenAddressResultBodyType>> {
  try {
    // Convert keyword to uppercase for case-insensitive search
    const searchQuery = args.keyword.toUpperCase();
    
    const token = await searchTokens({
      keyword: searchQuery,
      target: "token",
      sort_by: "volume_24h_usd",
      sort_type: "desc",
      offset: 0,
      limit: 10,
      chain: 'base'
    });
    
    if (!token) {
      throw new Error('Failed to fetch token data');
    }

    const tokenAddress = token?.items[0]?.result[0]?.address;

    if (!tokenAddress) {
      throw new Error('Failed to fetch token address');
    }

    return {
      message: `Found token address for ${args.keyword} on Base. The user is shown the following token address in the UI, DO NOT REITERATE THE TOKEN ADDRESS. Ask the user what they want to do next.`,
      body: {
        address: tokenAddress,
      }
    }
  } catch (error) {
    return {
      message: `Error getting token address on Base: ${error}`,
    };
  }
} 