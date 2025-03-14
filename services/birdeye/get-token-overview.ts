import { queryBirdeye } from "./base";
import { TokenOverview } from "./types/token-overview";
import { ChainType } from "@/app/_contexts/chain-context";

export const getTokenOverview = async (address: string, chain: ChainType = 'solana'): Promise<TokenOverview> => {
    return await queryBirdeye<TokenOverview>(
        'defi/token_overview',
        { address },
        chain
    );
} 