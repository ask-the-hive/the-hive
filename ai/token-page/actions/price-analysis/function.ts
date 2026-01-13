import { getTokenCandlesticks } from '@/services/hellomoon/get-token-candlesticks';
import type { SolanaActionResult } from '../../../solana/actions/solana-action';
import type { TokenChatData } from '@/types';
import type {
  TokenPagePriceAnalysisArgumentsType,
  TokenPagePriceAnalysisResultBodyType,
  TrendAnalysis,
} from './types';
import type { TokenOverview } from '@/services/birdeye/types/token-overview';
import { CandlestickGranularity, TokenPriceCandlestick } from '@/services/hellomoon/types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

const TIMEFRAME_TO_MINUTES: Record<CandlestickGranularity, number> = {
  [CandlestickGranularity.ONE_MIN]: 1,
  [CandlestickGranularity.FIVE_MIN]: 5,
  [CandlestickGranularity.ONE_HOUR]: 60,
  [CandlestickGranularity.ONE_DAY]: 1440,
  [CandlestickGranularity.ONE_WEEK]: 10080,
};

function formatNumber(num: number): string {
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 5,
  });
}

function getGranularity(days: number): CandlestickGranularity {
  if (days <= 3) return CandlestickGranularity.FIVE_MIN;
  if (days <= 30) return CandlestickGranularity.ONE_HOUR;
  return CandlestickGranularity.ONE_DAY;
}

export async function analyzeTokenPrice(
  token: TokenChatData,
  args: TokenPagePriceAnalysisArgumentsType,
): Promise<SolanaActionResult<TokenPagePriceAnalysisResultBodyType>> {
  try {
    const granularity = getGranularity(args.length);

    const timeframeMinutes = TIMEFRAME_TO_MINUTES[granularity];

    // Fetch OHLCV data
    const pricesResponse = await getTokenCandlesticks(token.address, granularity, args.length);

    if (!pricesResponse || pricesResponse.length === 0) {
      throw new Error('No price data available');
    }

    // Calculate current price and basic metrics
    const currentPrice = pricesResponse[pricesResponse.length - 1].close;
    const volatility = calculateVolatility(pricesResponse, timeframeMinutes);
    const trendAnalysis = analyzeTrend(pricesResponse);
    const technicalLevels = findSupportResistanceLevels(pricesResponse);
    const tradingVolume = calculateTradingVolume(pricesResponse, timeframeMinutes);
    const marketMetrics = calculateMarketMetrics(currentPrice, token);

    // Construct the analysis message
    const message = `Price Analysis for ${token.symbol}:

1. Current Price: ${formatNumber(currentPrice)}

2. Volatility Analysis:
   - Daily: ${volatility.daily.toFixed(2)}%
   - Weekly: ${volatility.weekly.toFixed(2)}%
   ${volatility.description}

3. Trend Analysis:
   - Direction: ${trendAnalysis.direction}
   - Strength: ${trendAnalysis.strength}/10
   ${trendAnalysis.description}

4. Trading Volume:
   - 24h Volume: ${formatNumber(tradingVolume.current24h)} ${token.symbol}
   - Volume Change: ${tradingVolume.change24h > 0 ? '+' : ''}${tradingVolume.change24h.toFixed(2)}%
   - Average Daily: ${formatNumber(tradingVolume.averageDaily)} ${token.symbol}

5. Market Metrics:
   - Market Cap: $${formatNumber(marketMetrics.marketCap)}
   - Fully Diluted Value: $${formatNumber(marketMetrics.fullyDilutedValue)}
   ${marketMetrics.rank ? `- Market Rank: #${marketMetrics.rank}` : ''}`;

    return {
      message,
      body: {
        currentPrice,
        volatility,
        trendAnalysis,
        technicalLevels,
        tradingVolume,
        marketMetrics,
      },
    };
  } catch (error) {
    console.error('Price analysis error:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't analyze price data right now.", error),
    };
  }
}

function calculateVolatility(prices: TokenPriceCandlestick[], timeframeMinutes: number) {
  // Calculate returns based on the timeframe
  const periodsPerDay = Math.floor(1440 / timeframeMinutes);
  const returns = calculateReturns(prices);

  // Annualize volatility based on the number of periods per day
  const daily = calculateStandardDeviation(returns) * 100 * Math.sqrt(periodsPerDay);
  const weekly = daily * Math.sqrt(7);

  let description = 'Low volatility, price is relatively stable';
  if (daily > 10) description = 'High volatility, significant price swings';
  else if (daily > 5) description = 'Moderate volatility, normal market conditions';

  return { daily, weekly, description };
}

function calculateReturns(prices: TokenPriceCandlestick[]): number[] {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
  }
  return returns;
}

function analyzeTrend(prices: TokenPriceCandlestick[]): TrendAnalysis {
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const current = prices[prices.length - 1].close;

  let direction: 'bullish' | 'bearish' | 'sideways' = 'sideways';
  let strength = 5;

  if (current > sma20 && sma20 > sma50) {
    direction = 'bullish';
    strength = calculateTrendStrength(prices, true);
  } else if (current < sma20 && sma20 < sma50) {
    direction = 'bearish';
    strength = calculateTrendStrength(prices, false);
  }

  const description = getTrendDescription(direction, strength);
  return { direction, strength, description };
}

function findSupportResistanceLevels(prices: TokenPriceCandlestick[]) {
  const sortedPrices = prices.map((p) => p.close).sort((a, b) => a - b);
  const quartiles = calculateQuartiles(sortedPrices);

  return {
    support: [quartiles.q1, quartiles.median],
    resistance: [quartiles.median, quartiles.q3],
  };
}

function calculateTradingVolume(prices: TokenPriceCandlestick[], timeframeMinutes: number) {
  const periodsPerDay = Math.floor(1440 / timeframeMinutes);
  const dailyVolumes = aggregateDailyVolumes(prices, periodsPerDay);

  const current24h = dailyVolumes[dailyVolumes.length - 1];
  const previous24h = dailyVolumes[dailyVolumes.length - 2] || current24h;
  const change24h = ((current24h - previous24h) / previous24h) * 100;
  const averageDaily = dailyVolumes.reduce((acc, vol) => acc + vol, 0) / dailyVolumes.length;

  return { current24h, change24h, averageDaily };
}

function aggregateDailyVolumes(prices: TokenPriceCandlestick[], periodsPerDay: number): number[] {
  const dailyVolumes: number[] = [];
  for (let i = 0; i < prices.length; i += periodsPerDay) {
    const dailyVolume = prices
      .slice(i, i + periodsPerDay)
      .reduce((sum, price) => sum + price.volume, 0);
    dailyVolumes.push(dailyVolume);
  }
  return dailyVolumes;
}

function calculateMarketMetrics(
  currentPrice: number,
  token: TokenChatData & Pick<TokenOverview, 'supply' | 'circulatingSupply'>,
) {
  const marketCap = currentPrice * (token.circulatingSupply || 0);
  const fullyDilutedValue = currentPrice * (token.supply || 0);

  return {
    marketCap,
    fullyDilutedValue,
    rank: null, // Would need additional data source for rank
  };
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateSMA(prices: TokenPriceCandlestick[], period: number): number {
  const values = prices.slice(-period).map((p) => p.close);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateTrendStrength(prices: TokenPriceCandlestick[], isBullish: boolean): number {
  let strength = 5;
  const recentPrices = prices.slice(-20);
  let consistentMoves = 0;

  for (let i = 1; i < recentPrices.length; i++) {
    const priceMove = recentPrices[i].close - recentPrices[i - 1].close;
    if ((isBullish && priceMove > 0) || (!isBullish && priceMove < 0)) {
      consistentMoves++;
    }
  }

  strength += (consistentMoves / recentPrices.length) * 5;
  return Math.min(Math.max(Math.round(strength), 1), 10);
}

function getTrendDescription(direction: string, strength: number): string {
  if (direction === 'sideways') return 'Price is moving sideways with no clear trend';
  const strengthDesc = strength >= 7 ? 'strong' : strength >= 4 ? 'moderate' : 'weak';
  return `${strengthDesc} ${direction} trend in place`;
}

function calculateQuartiles(sortedValues: number[]) {
  const len = sortedValues.length;
  return {
    q1: sortedValues[Math.floor(len * 0.25)],
    median: sortedValues[Math.floor(len * 0.5)],
    q3: sortedValues[Math.floor(len * 0.75)],
  };
}
