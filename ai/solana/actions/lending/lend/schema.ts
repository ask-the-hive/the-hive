import { z } from 'zod';

export const LendArgumentsType = z.object({
  amount: z.number(),
  tokenAddress: z.string(),
  protocolAddress: z.string(),
  walletAddress: z.string(),
});

export type LendArgumentsType = z.infer<typeof LendArgumentsType>;

export const LendResultBodyType = z.object({
  success: z.boolean(),
  transactionHash: z.string().optional(),
  amount: z.number(),
  tokenSymbol: z.string(),
  protocolName: z.string(),
  error: z.string().optional(),
});

export type LendResultBodyType = z.infer<typeof LendResultBodyType>;

export const LendResultType = z.object({
  message: z.string(),
  body: LendResultBodyType.nullable(),
});

export type LendResultType = z.infer<typeof LendResultType>;
