import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import { TimeFrame, TopTradersResponse } from "./types";

export const getTopTraders = async (
    timeFrame: TimeFrame = TimeFrame.Week,
    offset: number = 0,
    limit: number = 10,
    chain: ChainType = 'solana'
): Promise<TopTradersResponse> => {
    return queryBirdeye<TopTradersResponse>(
        'trader/gainers-losers',
        {
            type: timeFrame,
            sort_by: 'PnL',
            sort_type: 'desc',
            offset,
            limit
        },
        chain
    );
} 