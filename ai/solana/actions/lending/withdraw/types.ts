import { z } from 'zod';
import { WithdrawInputSchema } from './input-schema';
import type { SolanaActionResult } from '../../solana-action';

export type WithdrawArgumentsType = z.infer<typeof WithdrawInputSchema>;

export type WithdrawResultBodyType = {
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  tx?: string;
  amount: number;
  tokenSymbol?: string;
  protocolName?: string;
  yieldEarned?: number;
  error?: string;
};

export type WithdrawResultType = SolanaActionResult<WithdrawResultBodyType>;
