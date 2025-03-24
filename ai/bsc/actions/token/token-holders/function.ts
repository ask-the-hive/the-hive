import { searchTokens } from "@/services/birdeye";
import { getTokenHolders } from "@/services/moralis/get-token-holders";

import type { TokenHoldersArgumentsType, TokenHoldersResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

export async function getNumHolders(
  args: TokenHoldersArgumentsType
): Promise<BscActionResult<TokenHoldersResultBodyType>> {
  try {
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
      return {
        message: `No token found for ${args.search} on BSC`,
      };
    }

    // Then get the number of holders using the token's address
    const numHolders = await getTokenHolders(token.address);

    return {
      message: `The number of holders for the BSC token have been retrieved and displayed to the user. Now ask them what they want to do next.`,
      body: {
        numHolders,
      }
    };
  } catch (error) {
    return {
      message: `Error getting token holders on BSC: ${error}`,
    };
  }
} 