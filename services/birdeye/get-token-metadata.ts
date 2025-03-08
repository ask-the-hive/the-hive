import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";

import { TokenMetadata } from "./types";

export const getTokenMetadata = async (
    address: string,
    chain: ChainType = 'solana'
): Promise<TokenMetadata> => {
    try {
        console.log(`Fetching metadata for token ${address} on ${chain}`);
        const metadata = await queryBirdeye<TokenMetadata>(
            'defi/v3/token/meta-data/single',
            { address },
            chain
        );
        
        console.log(`Got metadata for ${address}: ${metadata.name} (${metadata.symbol}), logo: ${metadata.logo_uri || 'none'}`);
        return metadata;
    } catch (error) {
        console.error(`Error fetching metadata for token ${address} on ${chain}:`, error);
        // Return a minimal metadata object
        return {
            address,
            name: "Unknown Token",
            symbol: "UNKNOWN",
            decimals: 18,
            extensions: {},
            logo_uri: ""
        };
    }
} 