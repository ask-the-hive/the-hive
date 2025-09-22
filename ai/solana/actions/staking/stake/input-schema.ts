import { z } from 'zod';

// Define the liquid staking pool data schema
const LiquidStakingPoolSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  yield: z.number(),
  apyBase: z.number(),
  apyReward: z.number(),
  tvlUsd: z.number(),
  project: z.string(),
  poolMeta: z.string(),
  url: z.string(),
  rewardTokens: z.array(z.string()),
  underlyingTokens: z.array(z.string()),
  predictions: z
    .object({
      predictedClass: z.string(),
      predictedProbability: z.number(),
      binnedConfidence: z.number(),
    })
    .optional(),
  tokenData: z.any().nullable(),
});

export const StakeInputSchema = z.object({
  amount: z
    .number()
    .positive()
    .optional()
    .describe('The amount of SOL to stake. Must be a positive number but can be left empty.'),
  contractAddress: z
    .string()
    .describe('The contract address of the liquid staking provider to use.'),
  poolData: LiquidStakingPoolSchema.optional().describe(
    'The liquid staking pool data including yield, APY, TVL, and other details.',
  ),
});
