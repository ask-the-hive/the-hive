import { z } from 'zod';

export const LendingYieldsResultBodyType = z.array(
  z.object({
    name: z.string(),
    symbol: z.string(),
    yield: z.number(),
    apyBase: z.number(),
    apyReward: z.number(),
    tvlUsd: z.number(),
    project: z.string(),
    poolMeta: z.string().optional(),
    url: z.string().optional(),
    rewardTokens: z.array(z.string()).optional(),
    underlyingTokens: z.array(z.string()).optional(),
    tokenMintAddress: z.string().optional(), // Mint address from DefiLlama's underlyingTokens[0]
    predictions: z
      .object({
        predictedClass: z.string(),
        predictedProbability: z.number(),
        binnedConfidence: z.string(),
      })
      .optional(),
    tokenData: z
      .object({
        id: z.string(),
        symbol: z.string(),
        name: z.string(),
        decimals: z.number(),
        logoURI: z.string().optional(),
      })
      .nullable(),
  }),
);

export type LendingYieldsResultBodyType = z.infer<typeof LendingYieldsResultBodyType>;

export const LendingYieldsResultType = z.object({
  message: z.string(),
  body: LendingYieldsResultBodyType.optional(),
});

export type LendingYieldsResultType = z.infer<typeof LendingYieldsResultType>;

export const LendingYieldsPoolData = LendingYieldsResultBodyType.element;

export type LendingYieldsPoolData = z.infer<typeof LendingYieldsPoolData>;
