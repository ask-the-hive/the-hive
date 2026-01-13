import { getMarketsList } from '@/services/birdeye';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type {
  TokenPageLiquidityResultBodyType,
  TokenPageLiquidityArgumentsType,
} from '../liquidity/types';
import type { SolanaActionResult } from '../../../solana/actions/solana-action';
import type { TokenChatData } from '@/types';

export async function getBSCTokenPageLiquidity(
  token: TokenChatData,
  _: TokenPageLiquidityArgumentsType,
): Promise<SolanaActionResult<TokenPageLiquidityResultBodyType>> {
  try {
    const marketsResponse = await getMarketsList(token.address, 'bsc');

    if (!marketsResponse || !marketsResponse.items || marketsResponse.items.length === 0) {
      return {
        message: `Could not find liquidity data for this BSC token.`,
      };
    }

    const markets = marketsResponse.items;

    // Sort markets by liquidity
    const sortedMarkets = [...markets].sort((a, b) => b.liquidity - a.liquidity);

    // Calculate total liquidity
    const totalLiquidityUSD = sortedMarkets.reduce((acc, market) => acc + market.liquidity, 0);

    // Get main pool (highest liquidity)
    const mainPool = {
      source: sortedMarkets[0].source || 'PancakeSwap',
      liquidity: sortedMarkets[0].liquidity,
      address: sortedMarkets[0].address,
    };

    // Calculate volume metrics
    const volume24h = sortedMarkets.reduce((acc, market) => acc + (market.volume24h || 0), 0);

    // Use volume change if available, otherwise default to 0
    const volumeChange24h = sortedMarkets[0].trade24hChangePercent || 0;

    // Calculate liquidity concentration
    const topPoolShare = (mainPool.liquidity / totalLiquidityUSD) * 100;
    const top3PoolsShare =
      (sortedMarkets.slice(0, 3).reduce((acc, market) => acc + market.liquidity, 0) /
        totalLiquidityUSD) *
      100;

    // Calculate health score
    let healthScore = 0;

    // Factor 1: Total liquidity (0-40 points)
    if (totalLiquidityUSD >= 1000000) {
      healthScore += 40;
    } else if (totalLiquidityUSD >= 500000) {
      healthScore += 30;
    } else if (totalLiquidityUSD >= 100000) {
      healthScore += 20;
    } else if (totalLiquidityUSD >= 50000) {
      healthScore += 10;
    } else {
      healthScore += 5;
    }

    // Factor 2: Volume (0-30 points)
    if (volume24h >= 500000) {
      healthScore += 30;
    } else if (volume24h >= 100000) {
      healthScore += 25;
    } else if (volume24h >= 50000) {
      healthScore += 20;
    } else if (volume24h >= 10000) {
      healthScore += 15;
    } else if (volume24h >= 5000) {
      healthScore += 10;
    } else {
      healthScore += 5;
    }

    // Factor 3: Concentration (0-30 points)
    if (top3PoolsShare <= 70) {
      healthScore += 30;
    } else if (top3PoolsShare <= 80) {
      healthScore += 25;
    } else if (top3PoolsShare <= 90) {
      healthScore += 20;
    } else if (top3PoolsShare <= 95) {
      healthScore += 15;
    } else {
      healthScore += 10;
    }

    // Generate health description
    let healthDescription = '';
    if (healthScore >= 80) {
      healthDescription = 'Excellent liquidity with good distribution across multiple pools';
    } else if (healthScore >= 60) {
      healthDescription = 'Good liquidity with reasonable trading volume';
    } else if (healthScore >= 40) {
      healthDescription = 'Moderate liquidity, may experience some slippage on larger trades';
    } else {
      healthDescription = 'Limited liquidity, exercise caution when trading';
    }

    return {
      message: `BSC Token Liquidity Analysis:

1. Overall Liquidity:
   - Total Liquidity: $${formatNumber(totalLiquidityUSD)}
   - Main Pool: $${formatNumber(mainPool.liquidity)} on ${mainPool.source}
   - Number of Markets: ${sortedMarkets.length}

2. Volume Metrics:
   - 24h Volume: $${formatNumber(volume24h)}
   - 24h Change: ${volumeChange24h.toFixed(2)}%

3. Liquidity Concentration:
   - Top Pool Share: ${topPoolShare.toFixed(1)}%
   - Top 3 Pools Share: ${top3PoolsShare.toFixed(1)}%

4. Health Assessment:
   - Health Score: ${healthScore}/100
   - ${healthDescription}

${healthScore < 40 ? '⚠️ Warning: This token has limited liquidity which may result in high slippage and difficulty exiting positions.' : ''}`,
      body: {
        totalLiquidityUSD,
        mainPool,
        volumeMetrics: {
          volume24h,
          volumeChange24h,
        },
        liquidityConcentration: {
          topPoolShare,
          top3PoolsShare,
        },
        liquidityHealth: {
          score: healthScore,
          description: healthDescription,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't analyze liquidity right now.", error),
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}
