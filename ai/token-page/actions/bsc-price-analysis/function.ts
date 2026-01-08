import { getTokenPriceHistory, getTokenOverview } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type {
  TokenPagePriceAnalysisResultBodyType,
  TokenPagePriceAnalysisArgumentsType,
} from '../price-analysis/types';
import type { SolanaActionResult } from '../../../solana/actions/solana-action';
import type { TokenChatData } from '@/types';

export async function getBSCTokenPagePriceAnalysis(
  token: TokenChatData,
  _: TokenPagePriceAnalysisArgumentsType,
): Promise<SolanaActionResult<TokenPagePriceAnalysisResultBodyType>> {
  try {
    // Get token overview for current price and market data
    const overview = await getTokenOverview(token.address, 'bsc');

    if (!overview) {
      return {
        message: `Could not find price data for this BSC token.`,
      };
    }

    // Get price history for volatility and trend analysis
    const priceHistory = await getTokenPriceHistory(token.address, 1, 'bsc');

    if (!priceHistory || priceHistory.length === 0) {
      return {
        message: `Could not find price history data for this BSC token.`,
      };
    }

    // Current price from overview
    const currentPrice = overview.price;

    // Calculate volatility
    const prices = priceHistory.map((p) => p.value);
    const dailyChanges: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const percentChange = Math.abs(((prices[i] - prices[i - 1]) / prices[i - 1]) * 100);
      dailyChanges.push(percentChange);
    }

    // Daily volatility (average of absolute daily percentage changes)
    const dailyVolatility =
      dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length;

    // Weekly volatility (standard deviation of daily returns over 7 days)
    const recentDailyChanges = dailyChanges.slice(0, Math.min(7, dailyChanges.length));
    const avgRecentChange =
      recentDailyChanges.reduce((sum, change) => sum + change, 0) / recentDailyChanges.length;
    const weeklyVolatility = Math.sqrt(
      recentDailyChanges.reduce((sum, change) => sum + Math.pow(change - avgRecentChange, 2), 0) /
        recentDailyChanges.length,
    );

    // Determine volatility description
    let volatilityDescription = '';
    if (dailyVolatility > 10) {
      volatilityDescription = 'Extremely volatile with large daily price swings';
    } else if (dailyVolatility > 5) {
      volatilityDescription = 'Highly volatile compared to established tokens';
    } else if (dailyVolatility > 2) {
      volatilityDescription = 'Moderate volatility typical of mid-cap tokens';
    } else {
      volatilityDescription = 'Relatively stable price action';
    }

    // Trend analysis
    const firstPrice = prices[prices.length - 1];
    const lastPrice = prices[0];
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Determine trend direction
    let trendDirection: 'bullish' | 'bearish' | 'sideways' = 'sideways';
    if (priceChange > 5) {
      trendDirection = 'bullish';
    } else if (priceChange < -5) {
      trendDirection = 'bearish';
    }

    // Calculate trend strength (1-10 scale)
    const trendStrength = Math.min(10, Math.abs(priceChange) / 3);

    // Determine trend description
    let trendDescription = '';
    if (trendDirection === 'bullish' && trendStrength > 7) {
      trendDescription = 'Strong uptrend with consistent higher highs';
    } else if (trendDirection === 'bullish') {
      trendDescription = 'Moderate uptrend with some consolidation periods';
    } else if (trendDirection === 'bearish' && trendStrength > 7) {
      trendDescription = 'Strong downtrend with consistent lower lows';
    } else if (trendDirection === 'bearish') {
      trendDescription = 'Moderate downtrend with some relief rallies';
    } else {
      trendDescription = 'Ranging price action with no clear direction';
    }

    // Trading volume data
    const current24hVolume = overview.v24hUSD || 0;
    const volumeChange24h = overview.v24hChangePercent || 0;

    // Calculate average daily volume (in USD)
    // For BSC tokens, we don't have volume data in price history, so use the current 24h volume
    const averageDailyVolume = current24hVolume;

    // Market metrics
    const marketCap = overview.realMc || 0;
    const fullyDilutedValue = overview.marketCap || marketCap;

    // Technical levels (support and resistance)
    // Simple implementation - more sophisticated analysis would use pivot points, moving averages, etc.
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const lowerQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const median = sortedPrices[Math.floor(sortedPrices.length * 0.5)];
    const upperQuartile = sortedPrices[Math.floor(sortedPrices.length * 0.75)];

    const support = [lowerQuartile, median * 0.9];
    const resistance = [median * 1.1, upperQuartile];

    return {
      message: `BSC Token Price Analysis:

1. Current Price: ${currentPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}

2. Volatility:
   - Daily: ${dailyVolatility.toFixed(2)}%
   - Weekly: ${weeklyVolatility.toFixed(2)}%
   - ${volatilityDescription}

3. Trend Analysis:
   - Direction: ${trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
   - Strength: ${trendStrength.toFixed(1)}/10
   - ${trendDescription}

4. Trading Volume:
   - 24h Volume: ${current24hVolume.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
   - 24h Change: ${volumeChange24h.toFixed(2)}%
   - Average Daily: ${averageDailyVolume.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}

5. Market Metrics:
   - Market Cap: ${marketCap.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
   - Fully Diluted Value: ${fullyDilutedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}

6. Technical Levels:
   - Support: ${support[0].toLocaleString('en-US', { style: 'currency', currency: 'USD' })} and ${support[1].toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
   - Resistance: ${resistance[0].toLocaleString('en-US', { style: 'currency', currency: 'USD' })} and ${resistance[1].toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      body: {
        currentPrice,
        volatility: {
          daily: dailyVolatility,
          weekly: weeklyVolatility,
          description: volatilityDescription,
        },
        trendAnalysis: {
          direction: trendDirection,
          strength: trendStrength,
          description: trendDescription,
        },
        tradingVolume: {
          current24h: current24hVolume,
          change24h: volumeChange24h,
          averageDaily: averageDailyVolume,
        },
        marketMetrics: {
          marketCap,
          fullyDilutedValue,
          rank: null,
        },
        technicalLevels: {
          support,
          resistance,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't analyze price data right now.", error),
    };
  }
}
