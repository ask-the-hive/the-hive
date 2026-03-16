import { z } from 'zod';

export const GlobalYieldsResultBodyType = z.array(
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
    tokenMintAddress: z.string().optional(),
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
    yieldType: z.enum(['lending', 'staking']), // Add type to distinguish lending vs staking
    projectLogoURI: z.string().nullable().optional(),
  }),
);

export type GlobalYieldsResultBodyType = z.infer<typeof GlobalYieldsResultBodyType>;

export const GlobalYieldsResultType = z.object({
  message: z.string(),
  body: GlobalYieldsResultBodyType.optional(),
});

export type GlobalYieldsResultType = z.infer<typeof GlobalYieldsResultType>;

export const GlobalYieldsPoolData = GlobalYieldsResultBodyType.element;

export type GlobalYieldsPoolData = z.infer<typeof GlobalYieldsPoolData>;
