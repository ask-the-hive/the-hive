import { z } from 'zod';

export const WithdrawInputSchema = z.object({
  tokenAddress: z
    .string()
    .optional()
    .describe(
      'The token mint address to withdraw (optional). If omitted, the UI will let the user pick a lending position.',
    ),
  protocolAddress: z
    .string()
    .optional()
    .describe(
      'The lending protocol identifier (optional, e.g. "kamino" or "jupiter-lend"). If omitted, the UI will let the user pick a lending position.',
    ),
  amount: z.number().positive().optional().describe('The amount to withdraw (optional)'),
  walletAddress: z.string().describe('The wallet address to withdraw from'),
});
