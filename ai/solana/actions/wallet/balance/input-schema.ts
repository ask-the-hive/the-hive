import { z } from 'zod';
import { isSolanaAddressLike } from '@/lib/address';

export const BalanceInputSchema = z.object({
  walletAddress: z
    .string()
    .min(32, 'Wallet address must be at least 32 characters')
    .max(44, 'Wallet address must be at most 44 characters')
    .refine(isSolanaAddressLike, 'Invalid Solana wallet address format')
    .describe(
      'The wallet address to check balance for. Required. Must be a valid Solana public key.',
    ),
  tokenAddress: z
    .string()
    .refine(isSolanaAddressLike, 'Invalid Solana token address format')
    .optional()
    .describe('The token address to check balance for. If not provided, returns SOL balance'),
  tokenSymbol: z
    .string()
    .optional()
    .describe(
      'The token symbol (e.g., "USDG", "USDC"). If provided, will be used instead of fetching from DB.',
    ),
});
