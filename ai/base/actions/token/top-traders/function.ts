import { searchTokens, getTopTradersByToken } from "@/services/birdeye";

import type { TopTokenTradersArgumentsType, TopTokenTradersResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";

export async function getTopTokenTraders(
  args: TopTokenTradersArgumentsType
): Promise<BaseActionResult<TopTokenTradersResultBodyType>> {
  try {
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
      return {
        message: `No token found for ${args.search} on Base`,
      };
    }

    // Then get the top traders for the token
    const topTraders = await getTopTradersByToken({
      address: token.address,
      timeFrame: args.timeFrame,
      chain: 'base'
    });

    return {
      message: `Found top traders for ${token.name} (${token.symbol}) on Base. The top traders have been displayed to the user. Now ask them what they want to do next. DO NOT REPEAT THE RESULTS OF THIS TOOL.`,
      body: {
        topTraders: topTraders.items,
      }
    };
  } catch (error) {
    return {
      message: `Error getting top traders on Base: ${error}`,
    };
  }
} 