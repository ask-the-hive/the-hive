import type { BscActionResult } from "../../bsc-action";
import type { GetTokenDataArgumentsType, GetTokenDataResultBodyType } from "./types";
import { searchTokens, getTokenOverview } from "@/services/birdeye";

export async function getTokenData(args: GetTokenDataArgumentsType): Promise<BscActionResult<GetTokenDataResultBodyType>> {
  try {
    // Validate input
    if (!args.search) {
      return {
        message: "Please provide a token address, name, or symbol to search for",
      };
    }

    // Search for token
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
      // Provide specific reasons why token might not be found
      const searchTerm = args.search.toLowerCase();
      if (searchTerm.startsWith("0x") && searchTerm.length === 42) {
        return {
          message: `No data found for address ${args.search}. This could be because:
1. The token is very new and hasn't been indexed yet
2. The token has no trading activity
3. The contract address might be incorrect`,
        };
      } else {
        return {
          message: `No token found matching "${args.search}" on BSC. Try:
1. Using the exact token contract address
2. Checking if the token name/symbol is correct
3. Verifying the token exists on BSC (not another chain)`,
        };
      }
    }

    // Get token data
    try {
      const tokenData = await getTokenOverview(token.address, 'bsc');
      return {
        message: `Found token data for ${token.name} (${token.symbol}) on BSC`,
        body: {
          token: tokenData,
        },
      };
    } catch (overviewError) {
      return {
        message: `Found token ${token.name} (${token.symbol}) but couldn't fetch detailed data. This usually means:
1. The token is very new
2. The token has minimal trading history
3. The token might be inactive`,
      };
    }

  } catch (error) {
    console.error("Token data error:", error);
    return {
      message: `Error fetching token data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the token exists on BSC.`,
    };
  }
} 