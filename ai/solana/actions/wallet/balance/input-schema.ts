import { z } from 'zod';

// Solana public key validation - must be base58 encoded and 32-44 characters
const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const BalanceInputSchema = z.object({
  walletAddress: z
    .string()
    .min(32, 'Wallet address must be at least 32 characters')
    .max(44, 'Wallet address must be at most 44 characters')
    .regex(solanaAddressRegex, 'Invalid Solana wallet address format')
    .describe(
      'The wallet address to check balance for. Required. Must be a valid Solana public key.',
    ),
  tokenAddress: z
    .string()
    .regex(solanaAddressRegex, 'Invalid Solana token address format')
    .optional()
    .describe('The token address to check balance for. If not provided, returns SOL balance'),
  tokenSymbol: z
    .string()
    .optional()
    .describe(
      'The token symbol (e.g., "USDG", "USDC"). If provided, will be used instead of fetching from DB.',
    ),
});
