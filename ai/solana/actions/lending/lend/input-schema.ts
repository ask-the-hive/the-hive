import { z } from 'zod';

export const LendInputSchema = z.object({
  tokenAddress: z.string().describe('The contract address of the token to lend'),
  protocolAddress: z.string().describe('The contract address of the lending protocol'),
  protocol: z.string().describe('The name of the lending protocol (e.g., "francium", "kamino")'),
  amount: z.number().positive().optional().describe('The amount to lend (optional)'),
  walletAddress: z.string().describe('The wallet address to lend from'),
});
