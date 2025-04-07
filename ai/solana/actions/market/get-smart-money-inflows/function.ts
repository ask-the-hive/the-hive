import { getSmartMoneyInflows as getSmartMoneyInflowsService } from "@/services/hellomoon";

import type { GetSmartMoneyInflowsArgumentsType, GetSmartMoneyInflowsResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";
import { SmartMoneyTokenInflow } from "@/services/hellomoon/types";
import { getPrices, getTokenMetadata } from "@/services/birdeye";

import type { Price, TokenMetadata } from "@/services/birdeye/types";

export async function getSmartMoneyInflows(
  args: GetSmartMoneyInflowsArgumentsType
): Promise<SolanaActionResult<GetSmartMoneyInflowsResultBodyType>> {
  try {

    const response = await getSmartMoneyInflowsService(args.granularity, 10);

    const prices = await getPrices(response.map((token) => token.mint));

    const tokens = (await Promise.all(response.map(async (token) => {
      
      const tokenMetadata = await getTokenMetadata(token.mint).catch(() => null);

      return {
        inflow: token,
        token: tokenMetadata,
        price: prices[token.mint]
      };
    }))).filter((token) => token.token !== null && token.price !== null) as {
      inflow: SmartMoneyTokenInflow;
      token: TokenMetadata;
      price: Price;
    }[];

    return {
      body: {
        tokens,
      },
      message: `Found ${response.length} smart money inflows. The user is shown the inflows, do not list them. Ask the user what they want to do next.`,
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
