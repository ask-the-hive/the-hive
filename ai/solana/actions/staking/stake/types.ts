import { z } from 'zod';
import { StakeInputSchema } from './input-schema';
import { SolanaActionResult } from '../../solana-action';
import { LiquidStakingYieldsPoolData } from '../liquid-staking-yields/types';
import { Token } from '@/db/types';
// QuoteResponse type for Jupiter lite API
type QuoteResponse = any;

export type StakeSchemaType = typeof StakeInputSchema;

export type StakeArgumentsType = z.infer<StakeSchemaType>;

export type StakeResultBodyType = {
  tx: string;
  symbol: string;
  quote?: QuoteResponse;
  amount?: number;
  contractAddress?: string;
  outputTokenData?: Token;
  poolData?: LiquidStakingYieldsPoolData;
  outputAmount?: number;
};

export type StakeResultType = SolanaActionResult<StakeResultBodyType>;
