import { getTopTradersByToken } from "@/services/birdeye";
import { toUserFacingErrorTextWithContext } from "@/lib/user-facing-error";

import type { TopTokenTradersArgumentsType, TopTokenTradersResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";

export async function getTopTokenTraders(
  args: TopTokenTradersArgumentsType
): Promise<SolanaActionResult<TopTokenTradersResultBodyType>> {
  try {
    let topTraders = await getTopTradersByToken({
      address: args.tokenAddress,
      timeFrame: args.timeFrame,
      chain: 'solana'
    });

    return {
      message: `The top holders have been retrieved and displayed to the user. Now ask them what they want to do next. DO NOT REPEAT THE RESULTS OF THIS TOOL.`,
      body: {
        topTraders: topTraders.items,
      }
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load top traders right now.", error),
    };
  }
} 
