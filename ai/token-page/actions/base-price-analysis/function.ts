import { BaseGetPriceChartAction } from "@/ai/base/actions/token/price-chart";
import { getTokenOverview } from "@/services/birdeye";

import type { TokenChatData } from "@/types";
import type { TokenPagePriceAnalysisArgumentsType, TokenPagePriceAnalysisResultBodyType } from "../price-analysis/types";
import type { TokenPageActionResult } from "../types";

export async function getBaseTokenPagePriceAnalysis(token: TokenChatData, _: TokenPagePriceAnalysisArgumentsType): Promise<TokenPageActionResult<TokenPagePriceAnalysisResultBodyType>> {
    try {
        // Use existing Base price chart action
        const baseAction = new BaseGetPriceChartAction();
        
        // Get token overview data
        const overview = await getTokenOverview(token.address, 'base');
        
        if (!overview) {
            return {
                message: `Could not find price data for this Base token.`,
            };
        }
        
        // Get price metrics using the correct property names
        const currentPrice = overview.price || 0;
        // Use 24h price change percent instead of non-existent properties
        const priceChange24h = overview.price - (overview.history24hPrice || overview.price);
        const percentChange24h = overview.priceChange24hPercent || 0;
        
        // Calculate volatility and trend metrics
        const volatility24h = Math.abs(percentChange24h);
        
        // Determine price trend
        let priceTrend = "Neutral";
        if (percentChange24h > 5) {
            priceTrend = "Strongly Bullish";
        } else if (percentChange24h > 2) {
            priceTrend = "Bullish";
        } else if (percentChange24h < -5) {
            priceTrend = "Strongly Bearish";
        } else if (percentChange24h < -2) {
            priceTrend = "Bearish";
        }
        
        // Determine volatility level
        let volatilityLevel = "Low";
        if (volatility24h > 10) {
            volatilityLevel = "High";
        } else if (volatility24h > 5) {
            volatilityLevel = "Medium";
        }
        
        // Format the results according to the TokenPagePriceAnalysisResultBodyType
        return {
            message: `Base Token Price Analysis for ${token.symbol}:

Current Price: $${currentPrice.toFixed(6)}
24h Change: ${priceChange24h > 0 ? '+' : ''}$${priceChange24h.toFixed(6)} (${percentChange24h.toFixed(2)}%)

Price Trend: ${priceTrend}
Volatility: ${volatilityLevel}

The token is showing ${volatilityLevel.toLowerCase()} volatility with a ${priceTrend.toLowerCase()} price trend over the last 24 hours.`,
            body: {
                currentPrice,
                volatility: {
                    daily: volatility24h,
                    weekly: Math.abs(overview.priceChange24hPercent || 0) * 0.5, // Estimate for weekly volatility
                    description: `${volatilityLevel} volatility observed with ${Math.abs(percentChange24h).toFixed(2)}% 24h change`
                },
                trendAnalysis: {
                    direction: percentChange24h > 0 ? 'bullish' : percentChange24h < 0 ? 'bearish' : 'sideways',
                    strength: Math.min(Math.abs(percentChange24h) / 10, 1), // Normalize to 0-1 scale
                    description: `${priceTrend} trend based on 24h price movement`
                },
                technicalLevels: {
                    support: [currentPrice * 0.9, currentPrice * 0.8],
                    resistance: [currentPrice * 1.1, currentPrice * 1.2]
                },
                tradingVolume: {
                    current24h: overview.v24hUSD || 0,
                    change24h: overview.v24hChangePercent || 0,
                    averageDaily: overview.v24hUSD || 0
                },
                marketMetrics: {
                    marketCap: overview.marketCap || 0,
                    fullyDilutedValue: overview.marketCap || 0, // Use marketCap as a fallback
                    rank: null
                }
            }
        };
    } catch (error) {
        console.error(`Error analyzing price: ${error}`);
        return {
            message: `Error analyzing price data: ${error}`,
        };
    }
} 