import { SOLANA_LENDING_YIELDS_ACTION } from '../names';
import { LENDING_YIELDS_PROMPT } from './prompt';
import { LendingYieldsInputSchema } from './input-schema';
import { getLendingYields } from './function';

import type { LendingYieldsResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaLendingYieldsAction
  implements SolanaAction<typeof LendingYieldsInputSchema, LendingYieldsResultBodyType>
{
  public name = SOLANA_LENDING_YIELDS_ACTION;
  public description = LENDING_YIELDS_PROMPT;
  public argsSchema = LendingYieldsInputSchema;
  public func = getLendingYields;
}
