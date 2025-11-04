import { z } from 'zod';
import { TradeInputSchema } from './input-schema';
import { SolanaActionResult } from '../solana-action';

export type SolanaTradeSchemaType = typeof TradeInputSchema;

export type SolanaTradeArgumentsType = z.infer<SolanaTradeSchemaType>;

export type SolanaTradeResultBodyType = {
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
    transaction: string;
    inputAmount: number;
    inputToken: string;
    outputToken: string;
};

export type SolanaTradeResultType = SolanaActionResult<SolanaTradeResultBodyType>;
