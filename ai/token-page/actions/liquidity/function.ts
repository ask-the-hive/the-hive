import type { SolanaActionResult } from '../../../solana/actions/solana-action';
import type { TokenChatData } from '@/types';
import { getMarketsList } from '@/services/birdeye';
import type { MarketItem } from '@/services/birdeye/types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

import type { TokenPageLiquidityResultBodyType, TokenPageLiquidityArgumentsType } from './types';

export async function getTokenPageLiquidity(
  token: TokenChatData,
  args: TokenPageLiquidityArgumentsType,
): Promise<SolanaActionResult<TokenPageLiquidityResultBodyType>> {
  try {
    // Get all markets (pools) for the token
    const markets = await getMarketsList(token.address);

    // Calculate total liquidity across all pools
    const totalLiquidityUSD = markets.items.reduce(
      (acc: number, market: MarketItem) => acc + market.liquidity,
      0,
    );

    // Find main pool (pool with highest liquidity)
    const mainPool = markets.items.reduce((a: MarketItem, b: MarketItem) =>
      a.liquidity > b.liquidity ? a : b,
    );

    // Get volume metrics from the main pool
    const volumeMetrics = {
      volume24h: mainPool.volume24h,
      volumeChange24h: mainPool.trade24hChangePercent || 0,
    };

    // Calculate liquidity concentration
    const sortedPools = [...markets.items].sort((a, b) => b.liquidity - a.liquidity);
    const topPoolShare = (mainPool.liquidity / totalLiquidityUSD) * 100;
    const top3PoolsShare = sortedPools
      .slice(0, 3)
      .reduce((acc, pool) => acc + (pool.liquidity / totalLiquidityUSD) * 100, 0);

    // Calculate liquidity health score (0-100)
    const healthScore = calculateLiquidityHealthScore({
      totalLiquidity: totalLiquidityUSD,
      volumeMetrics,
      concentration: { topPoolShare, top3PoolsShare },
    });

    const healthDescription = getLiquidityHealthDescription(healthScore);

    return {
      message: `Liquidity Analysis for ${token.symbol}:

1. Overall Liquidity:
   - Total liquidity across all pools: $${formatNumber(totalLiquidityUSD)}
   - Main pool (${mainPool.source}): $${formatNumber(mainPool.liquidity)}
   - Liquidity concentration: ${top3PoolsShare.toFixed(1)}% in top 3 pools

2. Volume & Activity:
   - 24h volume: $${formatNumber(volumeMetrics.volume24h)}
   - 24h volume change: ${volumeMetrics.volumeChange24h.toFixed(2)}%

3. Concentration Analysis:
   - Top pool share: ${topPoolShare.toFixed(1)}%
   - Top 3 pools share: ${top3PoolsShare.toFixed(1)}%

Liquidity Health Score: ${healthScore}/100 - ${healthDescription}`,
      body: {
        totalLiquidityUSD,
        mainPool: {
          address: mainPool.address,
          liquidity: mainPool.liquidity,
          source: mainPool.source,
        },
        volumeMetrics,
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

function calculateLiquidityHealthScore({
  totalLiquidity,
  volumeMetrics,
  concentration,
}: {
  totalLiquidity: number;
  volumeMetrics: { volume24h: number };
  concentration: { topPoolShare: number; top3PoolsShare: number };
}): number {
  // Score components (0-100 each)
  const liquidityScore = Math.min(100, (totalLiquidity / 1000000) * 20); // Up to $5M for max score
  const volumeScore = Math.min(100, (volumeMetrics.volume24h / totalLiquidity) * 50); // Daily volume should be at least 2% of TVL
  const concentrationScore = Math.min(100, (1 - concentration.top3PoolsShare / 100) * 100); // Lower concentration is better

  // Weighted average
  return Math.round(liquidityScore * 0.4 + volumeScore * 0.3 + concentrationScore * 0.3);
}

function getLiquidityHealthDescription(score: number): string {
  if (score >= 90)
    return 'Excellent - Deep liquidity with healthy distribution and strong trading activity';
  if (score >= 75) return 'Good - Sufficient liquidity and trading volume';
  if (score >= 60)
    return 'Moderate - Adequate liquidity but may have concentration or volume concerns';
  if (score >= 40) return 'Fair - Limited liquidity or high concentration in few pools';
  return 'Poor - Shallow liquidity with concerning metrics';
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}
