import { seekTradesByTime } from "@/services/birdeye/seek-trades-by-time";
import { getTokenMetadata } from "@/services/birdeye/get-token-metadata";

import type { GetTraderTradesArgumentsType, GetTraderTradesResultBodyType, TokenTraded } from "./types";
import type { BaseActionResult } from "../../base-action";
import { Token } from "@/db/types/token";

interface TokenInfo {
    symbol: string;
    decimals: number;
    address: string;
    amount: string | number;
    type: string;
    type_swap: 'from' | 'to';
    fee_info?: any;
    ui_amount: number;
    price: number | null;
    nearest_price: number;
    change_amount: string | number;
    ui_change_amount: number;
    icon?: string;
}

/**
 * Gets the trades for a trader from Birdeye API on Base.
 *
 * @param args - The input arguments for the action
 * @returns A message containing the trader's trades information
 */
export const getTraderTrades = async (
    args: GetTraderTradesArgumentsType
): Promise<BaseActionResult<GetTraderTradesResultBodyType>> => {
    try {
        const trades = await seekTradesByTime({ address: args.address, chain: 'base' });
        const tokensTradedData: Record<string, Omit<TokenTraded, "token">> = {};

        // Helper function to update token data
        const updateTokenData = (tokenAddress: string, trade: TokenInfo) => {
            const amount = trade.ui_change_amount;
            const absoluteAmount = Math.abs(amount);
            const value = absoluteAmount * (trade.nearest_price || 0);

            if (tokensTradedData[tokenAddress]) {
                // Update existing token data
                tokensTradedData[tokenAddress].volume.buy += amount > 0 ? value : 0;
                tokensTradedData[tokenAddress].volume.sell += amount < 0 ? value : 0;
                tokensTradedData[tokenAddress].balanceChange += amount;
                tokensTradedData[tokenAddress].usdChange += amount * trade.nearest_price;
            } else {
                // Create new token data
                tokensTradedData[tokenAddress] = {
                    volume: {
                        buy: amount > 0 ? value : 0,
                        sell: amount < 0 ? value : 0,
                    },
                    balanceChange: amount,
                    usdChange: amount * (trade.nearest_price || 0),
                };
            }
        };

        // Process each trade
        for (const trade of trades.items) {
            updateTokenData(trade.quote.address, trade.quote);
            updateTokenData(trade.base.address, trade.base);
        }

        // Convert token addresses to Token objects
        const tokensTraded = await Promise.all(
            Object.entries(tokensTradedData).map(async ([address, data]) => {
                try {
                    const metadata = await getTokenMetadata(address, 'base');
                    const token: Token = {
                        id: address,
                        name: metadata.name || metadata.symbol,
                        symbol: metadata.symbol.toUpperCase(),
                        decimals: metadata.decimals,
                        logoURI: metadata.logo_uri || 'https://public-api.birdeye.so/unknown.png',
                        tags: [],
                        freezeAuthority: null,
                        mintAuthority: null,
                        permanentDelegate: null,
                        extensions: {}
                    };

                    return {
                        token,
                        ...data
                    };
                } catch (error) {
                    console.error(`Error fetching metadata for token ${address}:`, error);
                    // Find token info from trades
                    const tradeInfo = trades.items.find(
                        item => item.base.address === address || item.quote.address === address
                    );
                    
                    if (!tradeInfo) return null;
                    
                    const tokenInfo = tradeInfo.base.address === address ? tradeInfo.base : tradeInfo.quote;
                    const token: Token = {
                        id: address,
                        name: tokenInfo.symbol,
                        symbol: tokenInfo.symbol.toUpperCase(),
                        decimals: tokenInfo.decimals,
                        logoURI: 'https://public-api.birdeye.so/unknown.png',
                        tags: [],
                        freezeAuthority: null,
                        mintAuthority: null,
                        permanentDelegate: null,
                        extensions: {}
                    };

                    return {
                        token,
                        ...data
                    };
                }
            })
        );

        const tokensMap = tokensTraded
            .filter((item): item is TokenTraded => item !== null)
            .reduce((acc, curr) => {
                acc[curr.token.id] = curr;
                return acc;
            }, {} as Record<string, TokenTraded>);

        return {
            message: `Found ${trades.items.length} trades for the trader on Base. The user is shown the trades, do not list them. Ask the user what they want to do with the trades.`,
            body: {
                tokensTraded: tokensMap
            }
        };
    } catch (error) {
        return {
            message: `Error getting trades for the trader on Base: ${error}`,
            body: {
                tokensTraded: {}
            }
        };
    }
}; 