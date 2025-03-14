import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import { 
    TopTradersByTokenTimeFrame, 
    TopTradersByTokenSortType, 
    TopTradersByTokenSortBy, 
    TopTradersByTokenResponse 
} from "./types";

interface GetTopTradersByTokenParams {
    address: string;
    timeFrame?: TopTradersByTokenTimeFrame;
    sortType?: TopTradersByTokenSortType;
    sortBy?: TopTradersByTokenSortBy;
    offset?: number;
    limit?: number;
    chain?: ChainType;
}

export const getTopTradersByToken = async ({
    address,
    timeFrame = TopTradersByTokenTimeFrame.TwentyFourHours,
    sortType = TopTradersByTokenSortType.Descending,
    sortBy = TopTradersByTokenSortBy.Volume,
    offset = 0,
    limit = 10,
    chain = 'solana'
}: GetTopTradersByTokenParams): Promise<TopTradersByTokenResponse> => {
    return queryBirdeye<TopTradersByTokenResponse>(
        'defi/v2/tokens/top_traders',
        {
            address,
            time_frame: timeFrame,
            sort_type: sortType,
            sort_by: sortBy,
            offset,
            limit
        },
        chain
    );
} 