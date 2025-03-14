import { searchTokens } from "@/services/birdeye";

import type { BubbleMapsArgumentsType, BubbleMapsResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

export async function getBubbleMaps(
  args: BubbleMapsArgumentsType
): Promise<BscActionResult<BubbleMapsResultBodyType>> {
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
      chain: 'bsc'
    });

    const token = items?.[0]?.result?.[0];

    if (!token) {
      console.log(`No token found for: ${args.search}`);
      return {
        message: `No token found for ${args.search} on BSC`,
      };
    }

    console.log(`Found token: ${token.name} (${token.symbol}) with address: ${token.address}`);

    // For BSC, we need to use the correct chain identifier
    const chainIdentifier = 'bsc';
    
    // Check if bubble map is available
    try {
      const availabilityUrl = `https://api-legacy.bubblemaps.io/map-availability?chain=${chainIdentifier}&token=${token.address}`;
      console.log(`Checking bubble map availability at: ${availabilityUrl}`);
      
      // Use the same URL format as the BubbleMap component
      const response = await fetch(availabilityUrl);
      const data = await response.json();
      
      console.log(`Bubble map availability response:`, data);
      
      if (data.status === "OK" && data.availability) {
        // Use the same URL format as the BubbleMap component
        const bubbleMapUrl = `https://app.bubblemaps.io/${chainIdentifier}/token/${token.address}`;
        console.log(`Bubble map available at: ${bubbleMapUrl}`);
        
        return {
          message: `Found bubble map for ${token.name} (${token.symbol}) on BSC.`,
          body: {
            success: true,
            url: bubbleMapUrl
          }
        };
      } else {
        console.log(`Bubble map not available for: ${token.name} (${token.symbol})`);
        return {
          message: `Bubble map is not available for ${token.name} (${token.symbol}) on BSC. This could be because the token is too new or has limited on-chain activity.`,
          body: {
            success: false,
            url: ""
          }
        };
      }
    } catch (error) {
      console.error("Error checking bubble map availability:", error);
      return {
        message: `Error checking bubble map availability: ${error}`,
        body: {
          success: false,
          url: ""
        }
      };
    }
  } catch (error) {
    console.error("Error searching for token:", error);
    return {
      message: `Error getting bubble map on BSC: ${error}`,
    };
  }
} 