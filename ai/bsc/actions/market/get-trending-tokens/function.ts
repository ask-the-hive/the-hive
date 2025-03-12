import { getTrendingTokens as getTrendingTokensBirdeye } from "@/services/birdeye";

import type { GetTrendingTokensArgumentsType, GetTrendingTokensResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

export async function getTrendingTokens(
  args: GetTrendingTokensArgumentsType
): Promise<BscActionResult<GetTrendingTokensResultBodyType>> {
  try {
    const response = await getTrendingTokensBirdeye(0, 10, "bsc");

    return {
      message: `Found ${response.tokens.length} trending tokens on BSC. The user is shown the tokens, do not list them. Ask the user what they want to do with the coin.`,
      body: {
        tokens: response.tokens,
      }
    };
  } catch (error) {
    return {
      message: `Error getting trending tokens: ${error}`,
      body: {
        tokens: [],
      }
    };
  }
} 