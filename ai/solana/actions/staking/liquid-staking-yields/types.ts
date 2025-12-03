import { z } from 'zod';

import { LiquidStakingYieldsInputSchema } from './input-schema';

import type { SolanaActionResult } from '../../solana-action';
import type { Token } from '@/db/types';

export type LiquidStakingYieldsSchemaType = typeof LiquidStakingYieldsInputSchema;

export type LiquidStakingYieldsArgumentsType = z.infer<LiquidStakingYieldsSchemaType>;

export type LiquidStakingYieldsPoolData = {
  name: string;
  symbol: string;
  yield: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  project: string;
  poolMeta: string;
  url: string;
  rewardTokens: string[];
  underlyingTokens: string[];
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  tokenData: Token | null;
};

export type LiquidStakingYieldsResultBodyType = LiquidStakingYieldsPoolData[] | null;

export type LiquidStakingYieldsResultType = SolanaActionResult<LiquidStakingYieldsResultBodyType>;
