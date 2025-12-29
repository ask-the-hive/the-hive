import { getBestLiquidStaking } from '@/services/staking-rewards';

import { getTokenBySymbol } from '@/db/services';

import type { LiquidStakingYieldsResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';
import type { LiquidStakingYieldsArgumentsType } from './types';

/**
 * Gets the best liquid staking yields from Staking Rewards API.
 *
 * @returns A message containing the best liquid staking yields information
 */
export async function getLiquidStakingYields(
  args: LiquidStakingYieldsArgumentsType = {},
): Promise<SolanaActionResult<LiquidStakingYieldsResultBodyType>> {
  try {
    const response = await getBestLiquidStaking();

    // Filter for Solana chains first
    const solanaPools = response.data.filter((pool) => pool.chain === 'Solana');

    // Filter for the specific Solana liquid staking protocols based on actual data
    const directLiquidStakingProtocols = [
      'jito-liquid-staking', // Jito (JITOSOL)
      'marinade-liquid-staking', // Marinade (MSOL)
      'drift-staked-sol', // Drift (DSOL)
      'binance-staked-sol', // Binance (BNSOL)
      'bybit-staked-sol', // Bybit (BBSOL)
      'helius-staked-sol', // Helius (HSOL)
      'jupiter-staked-sol', // Jupiter (JUPSOL)
      'sanctum', // Sanctum (INF, LSTs)
      'lido', // Lido (STSOL)
      'blazestake', // BlazeStake (BSOL)
    ];

    // Liquid staking tokens that appear in other protocols
    const liquidStakingTokens = [
      'MSOL', // Marinade
      'JITOSOL', // Jito
      'BSOL', // BlazeStake
      'DSOL', // Drift
      'BNSOL', // Binance
      'BBSOL', // Bybit
      'HSOL', // Helius
      'JUPSOL', // Jupiter
      'INF', // Sanctum
      'STSOL', // Lido
      'JSOL', // Jupiter
    ];

    const solLiquidStakingPools = solanaPools.filter((pool) => {
      // Check if it's a direct liquid staking protocol
      const isDirectProtocol = directLiquidStakingProtocols.includes(pool.project);
      // Check if it's a liquid staking token (but exclude LP pairs)
      const isLiquidStakingToken = liquidStakingTokens.includes(pool.symbol);

      const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');
      const hasAPY = pool.apy && pool.apy > 0;

      // Include direct protocols OR liquid staking tokens that aren't LP pairs
      return (isDirectProtocol || isLiquidStakingToken) && !isLPPair && hasAPY;
    });

    if (solLiquidStakingPools.length === 0) {
      return {
        message: `No Solana liquid staking pools found for the target protocols (Jito, Marinade, Drift, Binance, Bybit, Helius, Jupiter, BlazeStake, Sanctum, Lido). Please try again.`,
        body: null,
      };
    }

    const sortBy = args.sortBy ?? 'apy';
    const limit = args.limit ?? 3;

    const sortedPools = solLiquidStakingPools
      .slice()
      .sort((a, b) => {
        if (sortBy === 'tvl') {
          return (b.tvlUsd || 0) - (a.tvlUsd || 0);
        }
        return (b.apy || 0) - (a.apy || 0);
      })
      .slice(0, limit);

    // Preserve the original UI layout for "top 3 by APY" (highest in center).
    if (sortBy === 'apy' && sortedPools.length === 3) {
      const [highest, second, third] = sortedPools;
      sortedPools[0] = second;
      sortedPools[1] = highest;
      sortedPools[2] = third;
    }

    // Transform to the expected format
    const body = await Promise.all(
      sortedPools.map(async (pool) => {
        const tokenData = await getTokenBySymbol(pool.symbol);
        return {
          name: pool.symbol,
          symbol: pool.symbol,
          yield: pool.apy || 0,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          tvlUsd: pool.tvlUsd || 0,
          project: pool.project,
          poolMeta: pool.poolMeta,
          url: pool.url,
          rewardTokens: pool.rewardTokens || [],
          underlyingTokens: pool.underlyingTokens || [],
          predictions: pool.predictions,
          tokenData: tokenData || null,
        };
      }),
    );

    const isSingle = limit === 1;
    return {
      message: isSingle
        ? `The safest pool (by TVL proxy) is displayed as a card above. Tell the user to click it to continue.`
        : `Top pools are displayed as cards above. Do NOT list or repeat them in text—ask the user to pick a provider card to continue staking.`,
      body,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best liquid staking yields: ${error}`,
    };
  }
}
