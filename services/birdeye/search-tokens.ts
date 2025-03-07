import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import type { SearchResponse } from "./types/search";

interface SearchTokensParams {
    keyword: string;
    target: string;
    sort_by: string;
    sort_type: string;
    offset: number;
    limit: number;
    chain?: ChainType;
}

export const searchTokens = async ({
    keyword,
    target = "token",
    sort_by = "volume_24h_usd",
    sort_type = "desc",
    offset = 0,
    limit = 10,
    chain = 'solana'
}: SearchTokensParams): Promise<SearchResponse> => {
    const params: Record<string, string | number> = {
        keyword,
        chain: chain,
        target,
        sort_by,
        sort_type,
        offset,
        limit
    };

    return queryBirdeye<SearchResponse>('defi/v3/search', params, chain);
} 