import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { getLendingYields } from '../lending/lending-yields/function';
import { getLiquidStakingYields } from '../staking/liquid-staking-yields/function';
import { GlobalYieldsResultBodyType } from './schema';

let cachedGlobalYields: {
  timestamp: number;
  result: SolanaActionResult<GlobalYieldsResultBodyType>;
} | null = null;

const GLOBAL_YIELDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getGlobalYields(): Promise<
  SolanaActionResult<GlobalYieldsResultBodyType>
> {
  try {
    if (
      cachedGlobalYields &&
      Date.now() - cachedGlobalYields.timestamp < GLOBAL_YIELDS_CACHE_TTL_MS
    ) {
      return cachedGlobalYields.result;
    }

    // Fetch both lending and staking yields in parallel
    const [lendingResult, stakingResult] = await Promise.all([
      getLendingYields(),
      getLiquidStakingYields(),
    ]);

    const lendingPools = lendingResult.body || [];
    const stakingPools = stakingResult.body || [];

    // Transform lending pools to include yieldType
    const lendingPoolsWithType = lendingPools.map((pool) => ({
      ...pool,
      yieldType: 'lending' as const,
    }));

    // Transform staking pools to include yieldType
    const stakingPoolsWithType = stakingPools.map((pool) => ({
      ...pool,
      yieldType: 'staking' as const,
    }));

    // Combine both types
    const allPools = [...lendingPoolsWithType, ...stakingPoolsWithType];

    if (allPools.length === 0) {
      return {
        message: `No yield opportunities found on Solana. Please try again later.`,
      };
    }

    // Sort by APY (highest first)
    const sortedPools = allPools.sort((a, b) => (b.yield || 0) - (a.yield || 0));

    // Take top 3 pools (matching lending and staking agent behavior)
    const topPools = sortedPools.slice(0, 3);

    const bestPool = topPools[0];
    const bestSummary = bestPool
      ? `Best yield: ${bestPool.symbol} via ${bestPool.project} (${bestPool.yieldType}) at ${(bestPool.yield || 0).toFixed(2)}% APY. `
      : 'No yields available yet. ';

    const result: SolanaActionResult<GlobalYieldsResultBodyType> = {
      message: `${bestSummary}Found ${topPools.length} yield opportunities across lending and staking. Compare the cards (APY and strategy type are shown in the UI) and pick the best fit to continue.\n\nText rules: keep to one short sentence, do NOT list pool names/symbols/APYs in text, do NOT mention other tokens unless the user asked for them. DO NOT CHECK BALANCES YET - wait for the user to select a specific pool first.`,
      body: topPools,
    };

    cachedGlobalYields = {
      timestamp: Date.now(),
      result,
    };

    return result;
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting global yields: ${error}`,
    };
  }
}
