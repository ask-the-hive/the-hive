import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import type { TokenHoldersResponse } from "./types";

interface GetTokenHoldersParams {
    address: string;
    offset?: number;
    limit?: number;
    chain?: ChainType;
}

export const getTokenHolders = async ({
    address,
    offset = 0,
    limit = 20,
    chain = 'solana'
}: GetTokenHoldersParams): Promise<TokenHoldersResponse> => {
    console.log(`Fetching top holders for ${address} on chain ${chain} with limit ${limit}`);
    
    return queryBirdeye<TokenHoldersResponse>(
        'defi/v3/token/holder',
        {
            address,
            offset,
            limit
        },
        chain
    );
} 