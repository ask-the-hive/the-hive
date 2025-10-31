import { SOLANA_LEND_ACTION } from '../names';
import { LEND_PROMPT } from './prompt';
import { LendInputSchema } from './input-schema';

import type { LendResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaLendAction implements SolanaAction<typeof LendInputSchema, LendResultBodyType> {
  public name = SOLANA_LEND_ACTION;
  public description = LEND_PROMPT;
  public argsSchema = LendInputSchema;
}
