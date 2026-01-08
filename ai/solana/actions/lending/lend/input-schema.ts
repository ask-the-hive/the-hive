import { z } from 'zod';

export const LendInputSchema = z.object({
  tokenAddress: z.string().optional().describe('The contract address of the token to lend'),
  tokenSymbol: z
    .string()
    .optional()
    .describe('The symbol of the token to lend (e.g., "USDC", "USDT")'),
  protocolAddress: z
    .string()
    .optional()
    .describe('The contract address of the lending protocol (optional)'),
  protocol: z.string().optional().describe('The name of the lending protocol (e.g., "kamino")'),
  amount: z.number().positive().optional().describe('The amount to lend (optional)'),
  walletAddress: z.string().optional().describe('The wallet address to lend from (optional)'),
});
