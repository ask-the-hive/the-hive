import { getTopTraders as getTopTradersBirdeye } from "@/services/birdeye";

import type { GetTopTradersArgumentsType, GetTopTradersResultBodyType } from "./types";
import type { BscActionResult } from "../../bsc-action";

/**
 * Gets the top traders from Birdeye API on BSC.
 *
 * @param args - The input arguments for the action
 * @returns A message containing the top traders information
 */
export async function getTopTraders(
    args: GetTopTradersArgumentsType
): Promise<BscActionResult<GetTopTradersResultBodyType>> {
    try {
        const response = await getTopTradersBirdeye(args.timeFrame, 0, 10, 'bsc');

        return {
            message: `Found ${response.items.length} top traders. The user is shown the traders, do not list them. Ask the user what they want to do with the traders.`,
            body: {
                traders: response.items,
            }
        };
    } catch (error) {
        return {
            message: `Error getting top traders: ${error}`,
            body: {
                traders: [],
            }
        };
    }
} 