import { NextResponse } from 'next/server';

import { getAllLiquidStakingPositions } from '@/db/services/liquid-staking-positions';
import { getBestLiquidStaking } from '@/services/staking-rewards/get-best-liquid-staking';
import { withErrorHandling } from '@/lib/api-error-handler';

export const GET = withErrorHandling(
  async (_request: Request, { params }: { params: Promise<{ walletAddress: string }> }) => {
    const { walletAddress } = await params;
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const positions = await getAllLiquidStakingPositions(walletAddress);

    // If no positions, return empty array
    if (!positions || positions.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch fresh pool data for all positions
    try {
      const allPools = await getBestLiquidStaking();

      const positionsWithFreshData = positions.map((position) => {
        try {
          // Find matching pool from DeFiLlama API
          const matchingPool = allPools.data?.find((pool: any) => {
            return (
              pool.project?.toLowerCase() === position.poolData.project?.toLowerCase() &&
              pool.symbol?.toLowerCase() === position.lstToken.symbol?.toLowerCase() &&
              pool.chain === 'Solana'
            );
          });

          if (matchingPool) {
            // Merge fresh data with existing pool data
            return {
              ...position,
              poolData: {
                ...position.poolData, // Preserve existing fields like name, tokenData
                yield: matchingPool.apy || position.poolData.yield,
                apyBase: matchingPool.apyBase || position.poolData.apyBase,
                apyReward: matchingPool.apyReward || position.poolData.apyReward,
                tvlUsd: matchingPool.tvlUsd || position.poolData.tvlUsd,
                url: matchingPool.url || position.poolData.url,
                rewardTokens: matchingPool.rewardTokens || position.poolData.rewardTokens,
                underlyingTokens:
                  matchingPool.underlyingTokens || position.poolData.underlyingTokens,
                poolMeta: matchingPool.poolMeta || position.poolData.poolMeta,
                predictions: matchingPool.predictions || position.poolData.predictions,
              },
            };
          }

          // Return original position if no matching pool found
          return position;
        } catch (error) {
          console.error(`Error updating pool data for ${position.lstToken.symbol}:`, error);
          return position;
        }
      });

      return NextResponse.json(positionsWithFreshData, { status: 200 });
    } catch (poolError) {
      console.warn(
        'Failed to fetch fresh pool data, returning positions with existing data:',
        poolError,
      );
      // Return original positions if pool data fetch fails
      return NextResponse.json(positions, { status: 200 });
    }
  },
);
