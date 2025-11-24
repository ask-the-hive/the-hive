import type { LiquidStakingPosition } from '@/db/types';
import type { ChainType } from '@/app/_contexts/chain-context';
import { getLiquidStakingPool } from './get-pool';
import { logger } from '@/lib/logger';

export async function getAllLiquidStakingPositions(
  walletAddress: string,
  chain: ChainType = 'solana',
) {
  if (chain !== 'solana') {
    return [];
  }

  // Just fetch positions from DB
  const res = await fetch(`/api/liquid-staking-positions/${walletAddress}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch liquid staking positions');
  }
  const positions = (await res.json()) as LiquidStakingPosition[];

  logger.info('[Staking] Fetched positions from DB', {
    walletAddress,
    positionCount: positions.length,
  });

  // Update each position with fresh pool data
  const promises = positions.map(async (position) => {
    logger.info('[Staking] Processing position', {
      positionId: position.id,
      project: position.poolData.project,
      symbol: position.lstToken.symbol,
    });
    try {
      // Fetch fresh pool data
      const freshData = await getLiquidStakingPool(
        position.poolData.project,
        position.lstToken.symbol,
      );
      logger.info('[Staking] Fresh pool data', {
        ...freshData,
      });
      // Return position with updated pool data (merge with existing to preserve missing fields)
      return {
        ...position,
        poolData: {
          ...position.poolData,
          ...freshData,
        },
      };
    } catch (err) {
      logger.error('❌ [Staking] Error fetching fresh pool data', {
        positionId: position.id,
        project: position.poolData.project,
        symbol: position.lstToken.symbol,
        error: err instanceof Error ? err.message : String(err),
      });
      // Return original position if fetch fails
      return position;
    }
  });

  const updatedPositions = await Promise.all(promises);

  logger.info('[Staking] Returning positions with updated pool data', {
    finalCount: updatedPositions.length,
  });

  return updatedPositions;
}
