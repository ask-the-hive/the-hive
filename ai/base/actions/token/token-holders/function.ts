import { searchTokens } from "@/services/birdeye";
import { getTokenHolders as getMoralisTokenHolders } from "@/services/moralis/get-token-holders";

import type { TokenHoldersArgumentsType, TokenHoldersResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";

export async function getTokenHolders(
    args: TokenHoldersArgumentsType
): Promise<BaseActionResult<TokenHoldersResultBodyType>> {
    try {
        console.log(`[Base Token Holders] Searching for token: ${args.search}`);
        
        // First, search for the token
        const { items } = await searchTokens({
            keyword: args.search,
            target: "token",
            sort_by: "volume_24h_usd",
            sort_type: "desc",
            offset: 0,
            limit: 10,
            chain: 'base'
        });

        const token = items?.[0]?.result?.[0];

        if (!token) {
            console.log(`[Base Token Holders] No token found for: ${args.search}`);
            return {
                message: `No token found for ${args.search} on Base`,
            };
        }

        console.log(`[Base Token Holders] Found token: ${token.name} (${token.symbol}) with address: ${token.address}`);

        try {
            // Get the actual holder count from Moralis
            const holderCount = await getMoralisTokenHolders(token.address, 'base');
            
            return {
                message: `Found holder information for ${token.name} (${token.symbol}) on Base.`,
                body: {
                    success: true,
                    tokenName: token.name,
                    tokenSymbol: token.symbol,
                    tokenLogo: (token as any).logo,
                    holderCount
                }
            };
        } catch (error) {
            console.error("[Base Token Holders] Error getting holder count:", error);
            return {
                message: `Error getting holder count: ${error}`,
                body: {
                    success: false,
                    holderCount: 0
                }
            };
        }
    } catch (error) {
        console.error("[Base Token Holders] Error searching for token:", error);
        return {
            message: `Error getting holder count on Base: ${error}`,
        };
    }
} 