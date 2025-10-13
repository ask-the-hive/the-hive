import type { LiquidStakingPosition } from '@/db/types';
import type { ChainType } from '@/app/_contexts/chain-context';
import { getLiquidStakingPool } from './get-pool';
import { deleteLiquidStakingPosition } from './delete';

export async function getAllLiquidStakingPositions(
  walletAddress: string,
  chain: ChainType = 'solana',
) {
  if (chain !== 'solana') {
    return [];
  }
  // Fetch positions from API
  const res = await fetch(`/api/liquid-staking-positions/${walletAddress}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch liquid staking positions');
  }
  const positions = (await res.json()) as LiquidStakingPosition[];

  // Fetch portfolio data to get current balances
  const portfolioRes = await fetch(`/api/portfolio/${walletAddress}?chain=${chain}`);
  if (!portfolioRes.ok) {
    console.error('Failed to fetch portfolio data');
    return positions;
  }
  const portfolio = await portfolioRes.json();

  // Update each position with fresh pool data and delete if balance is 0
  const promises = positions.map(async (position) => {
    try {
      // Check if user still has balance in this LST
      const portfolioToken = portfolio?.items?.find(
        (item: any) =>
          item.address === position.lstToken.id || item.symbol === position.lstToken.symbol,
      );

      const rawBalance = portfolioToken?.balance;
      // If current balance is 0 (user sold all their LST), delete the position
      // Only delete if position was created more than 5 minutes ago to avoid race conditions
      const fiveMinutesAgo = Date.now() - 2 * 60 * 1000;
      const isOlderThan2Minutes =
        position.createdAt && new Date(position.createdAt).getTime() < fiveMinutesAgo;

      if (
        (rawBalance === null || rawBalance === undefined || rawBalance === 0) &&
        isOlderThan2Minutes
      ) {
        console.log('Deleting liquid staking position for ', position.lstToken.symbol);
        console.log('Raw balance', rawBalance);
        console.log('Is older than 2 minutes', isOlderThan2Minutes);
        try {
          await deleteLiquidStakingPosition(position.id, position.walletAddress);
          console.log(
            `Deleted liquid staking position for ${position.lstToken.symbol} (zero balance)`,
          );
          return null; // Return null to filter out this position
        } catch (deleteError) {
          console.error(`Failed to delete position for ${position.lstToken.symbol}:`, deleteError);
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
      console.error(
        `Failed to fetch fresh pool data for ${position.poolData.project}-${position.lstToken.symbol}:`,
        err,
      );
      // Return original position if fetch fails
      return position;
    }
  });

  const results = await Promise.all(promises);
  const updatedPositions = results.filter((position) => position !== null);

  return updatedPositions;
}
