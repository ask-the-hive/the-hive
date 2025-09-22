import { getBestLiquidStaking } from '@/services/staking-rewards';

import { getTokenBySymbol } from '@/db/services';

import type { LiquidStakingYieldsResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';

/**
 * Gets the best liquid staking yields from Staking Rewards API.
 *
 * @returns A message containing the best liquid staking yields information
 */
export async function getLiquidStakingYields(): Promise<
  SolanaActionResult<LiquidStakingYieldsResultBodyType>
> {
  console.log('getLiquidStakingYields');
  debugger;
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
      'SAVESOL', // Save
      'HASOL', // Save
      'SSOL', // Save
      'HUBSOL', // Save
      'CBBTC', // Save
      'WSTETH', // Save
      'VSOL', // Kamino
      'RSTSOL', // Various
    ];

    const solLiquidStakingPools = solanaPools.filter((pool) => {
      // Check if it's a direct liquid staking protocol
      const isDirectProtocol = directLiquidStakingProtocols.includes(pool.project);

      // Check if it's a liquid staking token (but exclude LP pairs)
      const isLiquidStakingToken = liquidStakingTokens.includes(pool.symbol);
      const isLPPair = pool.symbol.includes('-') || pool.symbol.includes('/');

      // Include direct protocols OR liquid staking tokens that aren't LP pairs
      return isDirectProtocol || (isLiquidStakingToken && !isLPPair);
    });

    if (solLiquidStakingPools.length === 0) {
      return {
        message: `No Solana liquid staking pools found for the target protocols (Jito, Marinade, Drift, Binance, Bybit, Helius, Jupiter, BlazeStake, Sanctum, Lido). Please try again.`,
        body: null,
      };
    }

    // Sort by APY (highest first) and take top 3
    const topSolanaPools = solLiquidStakingPools
      .sort((a, b) => (b.apy || 0) - (a.apy || 0))
      .slice(0, 3);

    // Reorder so highest APY is in the center (index 1)
    if (topSolanaPools.length === 3) {
      const [highest, second, third] = topSolanaPools;
      topSolanaPools[0] = second; // Second highest on left
      topSolanaPools[1] = highest; // Highest APY in center
      topSolanaPools[2] = third; // Third highest on right
    }

    // Transform to the expected format
    const body = await Promise.all(
      topSolanaPools.map(async (pool) => {
        const tokenData = await getTokenBySymbol(pool.symbol, 'solana');
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

    return {
      message: `Found the ${body.length} top Solana liquid staking pools. The user has been shown the options in the UI, ask them which they want to use. DO NOT REITERATE THE OPTIONS IN TEXT.`,
      body,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best liquid staking yields: ${error}`,
    };
  }
}
