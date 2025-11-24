import { z } from 'zod';

export const WithdrawArgumentsType = z.object({
  amount: z.number(),
  tokenAddress: z.string(),
  protocolAddress: z.string(),
  walletAddress: z.string(),
});

export type WithdrawArgumentsType = z.infer<typeof WithdrawArgumentsType>;

export const WithdrawResultBodyType = z.object({
  success: z.boolean(),
  transactionHash: z.string().optional(),
  amount: z.number(),
  tokenSymbol: z.string(),
  protocolName: z.string(),
  yieldEarned: z.number().optional(),
  error: z.string().optional(),
});

export type WithdrawResultBodyType = z.infer<typeof WithdrawResultBodyType>;

export const WithdrawResultType = z.object({
  message: z.string(),
  body: WithdrawResultBodyType.nullable(),
});

export type WithdrawResultType = z.infer<typeof WithdrawResultType>;
