import { z } from 'zod';
import { LendInputSchema } from './input-schema';
import { SolanaActionResult } from '../../solana-action';
import { LendingYieldsPoolData } from '../lending-yields/schema';
import { Token } from '@/db/types';

export type LendSchemaType = typeof LendInputSchema;

export type LendArgumentsType = z.infer<LendSchemaType>;

export type LendResultBodyType = {
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  tx: string;
  amount: number;
  tokenData?: Token;
  poolData?: LendingYieldsPoolData;
};

export type LendResultType = SolanaActionResult<LendResultBodyType>;
