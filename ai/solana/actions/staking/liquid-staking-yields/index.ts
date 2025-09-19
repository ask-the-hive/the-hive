import { SOLANA_LIQUID_STAKING_YIELDS_ACTION } from './name';
import { SOLANA_LIQUID_STAKING_YIELDS_PROMPT } from './prompt';
import { LiquidStakingYieldsInputSchema } from './input-schema';
import { getLiquidStakingYields } from './function';
import type { LiquidStakingYieldsResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaLiquidStakingYieldsAction
  implements SolanaAction<typeof LiquidStakingYieldsInputSchema, LiquidStakingYieldsResultBodyType>
{
  public name = SOLANA_LIQUID_STAKING_YIELDS_ACTION;
  public description = SOLANA_LIQUID_STAKING_YIELDS_PROMPT;
  public argsSchema = LiquidStakingYieldsInputSchema;
  public func = getLiquidStakingYields;
}
