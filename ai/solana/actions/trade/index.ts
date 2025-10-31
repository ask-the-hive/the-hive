import { SOLANA_TRADE_ACTION } from './name';
import { SOLANA_TRADE_PROMPT } from './prompt';
import { TradeInputSchema } from './input-schema';
import { SolanaTradeResultBodyType } from './types';
import { trade } from './function';

import type { SolanaAction } from '../solana-action';

export class SolanaTradeAction
  implements SolanaAction<typeof TradeInputSchema, SolanaTradeResultBodyType>
{
  public name = SOLANA_TRADE_ACTION;
  public description = SOLANA_TRADE_PROMPT;
  public argsSchema = TradeInputSchema;
  public func = trade;
}
