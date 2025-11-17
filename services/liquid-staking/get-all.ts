import type { LiquidStakingPosition } from '@/db/types';
import type { ChainType } from '@/app/_contexts/chain-context';
import { getLiquidStakingPool } from './get-pool';
import { deleteLiquidStakingPosition } from './delete';
import { logger } from '@/lib/logger';

export async function getAllLiquidStakingPositions(
  walletAddress: string,
  chain: ChainType = 'solana',
) {
  if (chain !== 'solana') {
    return [];
  }
  // Fetch positions and portfolio data concurrently
  const [res, portfolioRes] = await Promise.all([
    fetch(`/api/liquid-staking-positions/${walletAddress}`),
    fetch(`/api/portfolio/${walletAddress}?chain=${chain}`),
  ]);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch liquid staking positions');
  }
  const positions = (await res.json()) as LiquidStakingPosition[];

  if (!portfolioRes.ok) {
    logger.error('Failed to fetch portfolio data', { walletAddress, chain });
    return positions;
  }
  const portfolio = await portfolioRes.json();

  // Update each position with fresh pool data and delete if balance is 0
  const promises = positions.map(async (position) => {
    logger.info('[Staking] Position details', {
      ...position,
    });
    try {
      // Check if user still has balance in this LST
      const portfolioToken = portfolio?.items?.find(
        (item: any) =>
          item.address === position.lstToken.id || item.symbol === position.lstToken.symbol,
      );
      logger.info('[Staking] Portfolio token details', {
        ...(portfolioToken ? { ...portfolioToken } : {}),
      });

      const rawBalance = portfolioToken.balance;
      logger.info('[Staking] Raw balance', {
        rawBalance,
      });
      // If current balance is 0 (user sold all their LST), delete the position
      // Only delete if position was created more than 5 minutes ago to avoid race conditions
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const isOlderThan2Minutes =
        position.createdAt && new Date(position.createdAt).getTime() < twoMinutesAgo;

      if (
        (rawBalance === null || rawBalance === undefined || rawBalance === 0) &&
        isOlderThan2Minutes
      ) {
        logger.info('🗑️ [Staking] Deleting liquid staking position', {
          symbol: position.lstToken.symbol,
          rawBalance,
          isOlderThan2Minutes,
          createdAt: position.createdAt,
        });
        try {
          await deleteLiquidStakingPosition(position.id, position.walletAddress);
          logger.info('✅ [Staking] Successfully deleted liquid staking position', {
            symbol: position.lstToken.symbol,
            reason: 'zero balance',
          });
          return null; // Return null to filter out this position
        } catch (deleteError) {
          logger.error('❌ [Staking] Failed to delete position', {
            symbol: position.lstToken.symbol,
            error: deleteError,
          });
          return null;
        }
      }

      // Calculate current USD value from actual portfolio balance
      const currentPriceUsd = portfolioToken?.priceUsd || 0;
      const decimals = portfolioToken?.decimals || position.lstToken.decimals || null;
      const currentBalance =
        rawBalance && decimals ? parseFloat(rawBalance.toString()) / Math.pow(10, decimals) : null;
      const currentUsdValue = currentBalance ? currentBalance * currentPriceUsd : null;

      // Fetch fresh pool data
      const freshData = await getLiquidStakingPool(
        position.poolData.project,
        position.lstToken.symbol,
      );

      // Return position with updated pool data (merge with existing to preserve missing fields)
      return {
        ...position,
        currentUsdValue,
        currentPriceUsd,
        poolData: {
          ...position.poolData,
          ...freshData,
        },
      };
    } catch (err) {
      logger.error('Failed to fetch fresh pool data', {
        project: position.poolData.project,
        symbol: position.lstToken.symbol,
        error: err,
      });
      // Return original position if fetch fails
      return position;
    }
  });

  const results = await Promise.all(promises);
  const updatedPositions = results.filter((position) => position !== null);

  return updatedPositions;
}
