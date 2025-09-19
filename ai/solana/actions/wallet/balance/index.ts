import { SOLANA_BALANCE_ACTION } from './name';
import { SOLANA_BALANCE_PROMPT } from './prompt';
import { BalanceInputSchema } from './input-schema';
import { BalanceResultBodyType } from './types';
import { getBalance } from './function';

import type { SolanaAction } from '../../solana-action';

export class SolanaBalanceAction
  implements SolanaAction<typeof BalanceInputSchema, BalanceResultBodyType>
{
  public name = SOLANA_BALANCE_ACTION;
  public description = SOLANA_BALANCE_PROMPT;
  public argsSchema = BalanceInputSchema;
  public func = getBalance;
}
