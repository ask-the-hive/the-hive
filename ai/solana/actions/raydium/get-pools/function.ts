import { getRaydiumPoolById } from "@/services/raydium";
import { getToken, getTokenBySymbol } from "@/db/services";
import { getTokenPairsFromAddress } from "@/services/dexscreener";
import { toUserFacingErrorTextWithContext } from "@/lib/user-facing-error";

import type { GetPoolsArgumentsType, GetPoolsResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";

/**
 * Gets the token data for a given ticker.
 *
 * @param connection - The Solana connection instance
 * @param args - The input arguments for the action
 * @returns A message containing the token data
 */
export async function getPools(args: GetPoolsArgumentsType): Promise<SolanaActionResult<GetPoolsResultBodyType>> {
  try {

    if (args.address) {
        const token = await getToken(args.address);

        if (!token) throw new Error('No token data found');
        const dexscreenerPairs = await getTokenPairsFromAddress(args.address);
        
        const pools = await Promise.all(dexscreenerPairs.filter(pair => pair.dexId === "raydium").map(async (pair) => {
            const raydiumPool = await getRaydiumPoolById(pair.pairAddress);
            return {
                pair,
                pool: raydiumPool
            };
        }));

        return {
            body: {
                pools
            },
            message: `Found pools for ${args.address}. The user is shown pools in the UI, DO NOT REITERATE THE POOLS. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
        }
    } else if (args.ticker) {
        const token = await getTokenBySymbol(args.ticker);
        if (!token) throw new Error('No token data found');
        const dexscreenerPairs = await getTokenPairsFromAddress(token.id);
        const pools = await Promise.all(dexscreenerPairs.filter(pair => pair.dexId === "raydium").map(async (pair) => {
            const raydiumPool = await getRaydiumPoolById(pair.pairAddress);
            return {
                pair,
                pool: raydiumPool
            };
        }));
        return {
            body: {
                pools
            },
            message: `Found token data for ${args.ticker}. The user is shown the following token data in the UI, DO NOT REITERATE THE TOKEN DATA. Ask the user what they want to do next. DO NOT LIST THE POOLS IN TEXT.`,
        }
    } else {
        throw new Error('Invalid input');
    }
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load pools right now.", error),
    };
  }
}
