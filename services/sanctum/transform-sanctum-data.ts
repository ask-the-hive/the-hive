import { getTokenBySymbol } from '@/db/services';
import type { LiquidStakingYieldsPoolData } from '@/ai/solana/actions/staking/liquid-staking-yields/types';
import type { SanctumLST } from './types';

/**
 * Transforms Sanctum LST data to match LiquidStakingYieldsPoolData format
 */
export const transformSanctumLSTToPoolData = async (
  sanctumLST: SanctumLST,
): Promise<LiquidStakingYieldsPoolData> => {
  const tokenData = await getTokenBySymbol(sanctumLST.symbol);

  return {
    name: sanctumLST.name,
    symbol: sanctumLST.symbol,
    yield: sanctumLST.latestApy,
    apyBase: sanctumLST.latestApy, // Sanctum doesn't separate base/reward APY
    apyReward: 0, // Sanctum doesn't provide separate reward APY
    tvlUsd: sanctumLST.tvl,
    project: sanctumLST.pool.program, // Use the underlying program (e.g., "Lido", "Marinade")
    poolMeta: sanctumLST.oneLiner,
    url: sanctumLST.website,
    rewardTokens: [], // Sanctum doesn't provide this information
    underlyingTokens: [sanctumLST.mint], // Use the LST mint address
    predictions: undefined, // Not provided by Sanctum
    tokenData: tokenData || null,
  };
};
