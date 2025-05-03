import { queryBirdeye } from "./base";
import { ChainType } from "@/app/_contexts/chain-context";
import { TokenOverview } from "./types/token-overview";

export interface PriceHistoryItem {
    unixTime: number;
    value: number;
}

export const getTokenPriceHistory = async (
    address: string,
    numDays: number = 1,
    chain: ChainType = 'solana'
): Promise<PriceHistoryItem[]> => {
    // For BSC and Base tokens, use the token_overview endpoint and extract price history
    if (chain === 'bsc' || chain === 'base') {
        try {
            const overview = await queryBirdeye<TokenOverview>(
                'defi/token_overview',
                { address },
                chain
            );
            
            // Extract price history data from the overview response
            const now = Math.floor(Date.now() / 1000);
            const pricePoints: PriceHistoryItem[] = [];
            
            // Current price
            pricePoints.push({
                unixTime: now,
                value: overview.price
            });
            
            // 30m ago
            if (overview.history30mPrice) {
                pricePoints.push({
                    unixTime: now - 30 * 60,
                    value: overview.history30mPrice
                });
            }
            
            // 1h ago
            if (overview.history1hPrice) {
                pricePoints.push({
                    unixTime: now - 60 * 60,
                    value: overview.history1hPrice
                });
            }
            
            // 2h ago
            if (overview.history2hPrice) {
                pricePoints.push({
                    unixTime: now - 2 * 60 * 60,
                    value: overview.history2hPrice
                });
            }
            
            // 4h ago
            if (overview.history4hPrice) {
                pricePoints.push({
                    unixTime: now - 4 * 60 * 60,
                    value: overview.history4hPrice
                });
            }
            
            // 8h ago
            if (overview.history8hPrice) {
                pricePoints.push({
                    unixTime: now - 8 * 60 * 60,
                    value: overview.history8hPrice
                });
            }
            
            // 24h ago
            if (overview.history24hPrice) {
                pricePoints.push({
                    unixTime: now - 24 * 60 * 60,
                    value: overview.history24hPrice
                });
            }
            
            // Sort by time ascending
            return pricePoints.sort((a, b) => a.unixTime - b.unixTime);
        } catch (error) {
            console.error(`Error fetching ${chain.toUpperCase()} token overview for price history:`, error);
            return [];
        }
    }
    
    // For Solana tokens, use the original price_history endpoint
    // Calculate start time in seconds (24 hours ago)
    const startTime = Math.floor(Date.now() / 1000) - (numDays * 86400);
    
    return queryBirdeye<PriceHistoryItem[]>(
        'defi/price_history',
        { 
            address,
            type: 'time',
            time_from: startTime.toString(),
            time_to: Math.floor(Date.now() / 1000).toString()
        },
        chain
    );
}; 