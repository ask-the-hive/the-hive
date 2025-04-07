import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import type { Price } from "./types";

export const getPrices = async (
    addresses: string[], 
    chain: ChainType = 'solana'
): Promise<Record<string, Price | null>> => {
    return queryBirdeye<Record<string, Price>>(
        'defi/multi_price', 
        { list_address: addresses.join(','), include_liquidity: 'true' },
        chain
    );
};