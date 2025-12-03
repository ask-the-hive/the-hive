import { z } from 'zod';

export const WithdrawInputSchema = z.object({
  tokenAddress: z.string().describe('The contract address of the token to withdraw'),
  protocolAddress: z.string().describe('The contract address of the lending protocol'),
  amount: z.number().positive().optional().describe('The amount to withdraw (optional)'),
  walletAddress: z.string().describe('The wallet address to withdraw from'),
});
