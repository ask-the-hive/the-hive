import { searchTokens } from "@/services/birdeye";
import { getTokenTopHolders } from "@/services/moralis";

import type { TopHoldersArgumentsType, TopHoldersResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";

export async function getTopHolders(
  args: TopHoldersArgumentsType
): Promise<BaseActionResult<TopHoldersResultBodyType>> {
  try {
    console.log(`Searching for token: ${args.search}`);
    
    // First, search for the token
    const { items } = await searchTokens({
      keyword: args.search,
      target: "token",
      sort_by: "volume_24h_usd",
      sort_type: "desc",
      offset: 0,
      limit: 10,
      chain: 'base'
    });

    const token = items?.[0]?.result?.[0];

    if (!token) {
      console.log(`No token found for: ${args.search}`);
      return {
        message: `No token found for ${args.search} on Base`,
      };
    }

    console.log(`Found token: ${token.name} (${token.symbol}) with address: ${token.address}`);

    try {
      // Get the top holders for the token
      const topHolders = await getTokenTopHolders(token.address, 'base');
      
      if (!topHolders || topHolders.length === 0) {
        return {
          message: `No holders found for ${token.name} (${token.symbol}) on Base`,
        };
      }
      
      // Calculate the total percentage owned by top holders
      const totalPercentage = topHolders.reduce((acc, holder) => acc + holder.percentage, 0);
      
      console.log(`Found ${topHolders.length} top holders for ${token.name} (${token.symbol})`);

      return {
        message: `The top holders information is already displayed in the UI. DO NOT LIST OR DESCRIBE THE HOLDERS IN YOUR RESPONSE. Instead, ask the user what they would like to know next.`,
        body: {
          topHolders,
          totalPercentage
        }
      };
    } catch (error) {
      console.error("Error getting top holders from Moralis:", error);
      return {
        message: `Error getting top holders for ${token.name} (${token.symbol}) on Base: ${error}`,
      };
    }
  } catch (error) {
    console.error("Error searching for token:", error);
    return {
      message: `Error getting top holders on Base: ${error}`,
    };
  }
} 