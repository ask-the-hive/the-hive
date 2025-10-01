import { z } from 'zod';

import { BalanceInputSchema } from './input-schema';
import { SolanaActionResult } from '../../solana-action';

export type BalanceSchemaType = typeof BalanceInputSchema;

export type BalanceArgumentsType = z.infer<BalanceSchemaType>;

export type BalanceResultBodyType = {
  balance: number;
  token: string;
  name: string;
  logoURI: string;
  needsSOL: boolean;
  canStake: boolean;
};

export type BalanceResultType = SolanaActionResult<BalanceResultBodyType>;
