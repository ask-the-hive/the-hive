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
  try {
    const bestLiquidStaking = await getBestLiquidStaking(6);

    if ((bestLiquidStaking?.errors?.length ?? 0) > 0) {
      return {
        message: `Error getting best liquid staking yields: ${bestLiquidStaking?.errors?.join(', ')}`,
        body: null,
      };
    }

    const rewardOptions = bestLiquidStaking?.data?.rewardOptions;
    if (!rewardOptions || (rewardOptions?.length ?? 0) === 0) {
      return {
        message: `No liquid staking yields found. Please try again.`,
        body: null,
      };
    }

    const body = (
      await Promise.all(
        rewardOptions.map(async option => ({
          name: option.outputAssets[0].name,
          yield:
            option.metrics.find(metric => metric.metricKey === 'reward_rate')
              ?.defaultValue ?? 0,
          tokenData: await getTokenBySymbol(option.outputAssets[0].symbol),
        }))
      )
    ).filter(
      item => item.tokenData !== undefined
    ) as LiquidStakingYieldsResultBodyType;

    return {
      message: `Found ${rewardOptions.length} best liquid staking yields. The user has been shown the options in the UI, ask them which they want to use. DO NOT REITERATE THE OPTIONS IN TEXT.`,
      body,
    };
  } catch (error) {
    console.error(error);
    return {
      message: `Error getting best liquid staking yields: ${error}`,
    };
  }
}
