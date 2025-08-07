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

    // Use the full chain name for the URL
    const chainName = 'bsc';
    
    // Directly construct the embed URL
    const partnerId = process.env.BUBBLE_MAPS_PARTNER_ID;
    if (!partnerId) {
      console.error('BUBBLE_MAPS_PARTNER_ID is not set in environment variables');
      return {
        message: 'Bubble Maps integration is not properly configured',
        body: {
          success: false,
          url: ''
        }
      };
    }
    const bubbleMapUrl = `https://iframe.bubblemaps.io/map?address=${token.address}&chain=${chainName}&partnerId=${partnerId}`;
    console.log(`Generated bubble map URL: ${bubbleMapUrl}`);
    
    return {
      message: `Bubble map for ${token.name} (${token.symbol}) on BSC.`,
      body: {
        success: true,
        url: bubbleMapUrl
      }
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      message: `Error getting bubble map on BSC: ${error}`,
      body: {
        success: false,
        url: ""
      }
    };
  }
} 