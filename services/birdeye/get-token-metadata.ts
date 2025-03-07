import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import { TokenMetadata } from "./types";

export const getTokenMetadata = async (
    address: string,
    chain: ChainType = 'solana'
): Promise<TokenMetadata> => {
    return queryBirdeye<TokenMetadata>(
        'defi/v3/token/meta-data/single',
        { address },
        chain
    );
} 