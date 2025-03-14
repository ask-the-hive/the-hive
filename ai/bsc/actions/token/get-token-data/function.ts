import type { BscActionResult } from "../../bsc-action";
import type { GetTokenDataArgumentsType, GetTokenDataResultBodyType } from "./types";
import { searchTokens, getTokenOverview } from "@/services/birdeye";

export async function getTokenData(args: GetTokenDataArgumentsType): Promise<BscActionResult<GetTokenDataResultBodyType>> {
  try {
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

    return {
        message: `Token data for ${args.search} on BSC`,
        body: {
            token: await getTokenOverview(token.address, 'bsc'),
        },
    };

  } catch (error) {
    console.error(error);
    return {
      message: `Error getting token data on BSC: ${error}`,
    };
  }
} 