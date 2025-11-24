import { SOLANA_STAKE_ACTION } from './name';
import { SOLANA_STAKE_PROMPT } from './prompt';
import { StakeInputSchema } from './input-schema';
import { stakeSol } from './function';

import type { StakeResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaStakeAction
  implements SolanaAction<typeof StakeInputSchema, StakeResultBodyType>
{
  public name = SOLANA_STAKE_ACTION;
  public description = SOLANA_STAKE_PROMPT;
  public argsSchema = StakeInputSchema;
  public func = stakeSol;
}
