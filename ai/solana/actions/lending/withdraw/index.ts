import { SOLANA_WITHDRAW_ACTION } from '../names';
import { WITHDRAW_PROMPT } from './prompt';
import { WithdrawInputSchema } from './input-schema';
import { withdraw } from './function';

import type { WithdrawResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaWithdrawAction
  implements SolanaAction<typeof WithdrawInputSchema, WithdrawResultBodyType>
{
  public name = SOLANA_WITHDRAW_ACTION;
  public description = WITHDRAW_PROMPT;
  public argsSchema = WithdrawInputSchema;
  public func = withdraw;
}
