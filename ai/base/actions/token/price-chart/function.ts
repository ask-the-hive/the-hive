import { searchTokens } from "@/services/birdeye";

import type { PriceChartArgumentsType, PriceChartResultBodyType } from "./types";
import type { BaseActionResult } from "../../base-action";

export async function getPriceChart(
    args: PriceChartArgumentsType
): Promise<BaseActionResult<PriceChartResultBodyType>> {
    try {
        console.log(`[Base Price Chart] Searching for token: ${args.search}`);
        
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
            console.log(`[Base Price Chart] No token found for: ${args.search}`);
            return {
                message: `No token found for ${args.search} on Base`,
            };
        }

        console.log(`[Base Price Chart] Found token: ${token.name} (${token.symbol}) with address: ${token.address}`);
            
        return {
            message: `Found price chart for ${token.name} (${token.symbol}) on Base.`,
            body: {
                success: true,
                tokenAddress: token.address,
                tokenName: token.name,
                tokenSymbol: token.symbol,
                tokenLogo: token.logo_uri
            }
        };
    } catch (error) {
        console.error("[Base Price Chart] Error searching for token:", error);
        return {
            message: `Error getting price chart on Base: ${error}`,
        };
    }
} 