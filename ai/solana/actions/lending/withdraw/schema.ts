import { z } from 'zod';

export const WithdrawArgumentsType = z.object({
  tokenAddress: z.string().optional(),
  protocolAddress: z.string().optional(),
  walletAddress: z.string(),
  amount: z.number().positive().optional(),
});

export type WithdrawArgumentsType = z.infer<typeof WithdrawArgumentsType>;

export const WithdrawResultBodyType = z.object({
  status: z.enum(['pending', 'complete', 'failed', 'cancelled']),
  tx: z.string().optional(),
  amount: z.number(),
  tokenSymbol: z.string().optional(),
  protocolName: z.string().optional(),
  yieldEarned: z.number().optional(),
  error: z.string().optional(),
});

export type WithdrawResultBodyType = z.infer<typeof WithdrawResultBodyType>;

export const WithdrawResultType = z.object({
  message: z.string(),
  body: WithdrawResultBodyType.nullable(),
});

export type WithdrawResultType = z.infer<typeof WithdrawResultType>;
