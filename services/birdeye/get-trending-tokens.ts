import { queryBirdeye } from "./base";
import { TrendingTokensResponse } from "./types/trending";
import { ChainType } from "@/app/_contexts/chain-context";

export const getTrendingTokens = async (
    offset: number = 0,
    limit: number = 20,
    chain: ChainType = 'solana'
): Promise<TrendingTokensResponse> => {
    return queryBirdeye<TrendingTokensResponse>(
        'defi/token_trending',
        {
            sort_by: 'rank',
            sort_type: 'asc',
            offset,
            limit
        },
        chain
    );
}
