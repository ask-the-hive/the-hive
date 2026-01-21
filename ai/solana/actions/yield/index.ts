import { SOLANA_GLOBAL_YIELDS_ACTION } from './names';
import { GLOBAL_YIELDS_PROMPT } from './prompt';
import { GlobalYieldsInputSchema } from './input-schema';
import { getGlobalYields } from './function';
import type { GlobalYieldsResultBodyType } from './types';
import type { SolanaAction } from '../solana-action';

export class SolanaGlobalYieldsAction
  implements SolanaAction<typeof GlobalYieldsInputSchema, GlobalYieldsResultBodyType>
{
  public name = SOLANA_GLOBAL_YIELDS_ACTION;
  public description = GLOBAL_YIELDS_PROMPT;
  public argsSchema = GlobalYieldsInputSchema;
  public func = getGlobalYields;
}
