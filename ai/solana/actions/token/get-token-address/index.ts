import { SOLANA_GET_TOKEN_ADDRESS_ACTION } from './name';
import { SOLANA_GET_TOKEN_ADDRESS_PROMPT } from './prompt';
import { GetTokenAddressArgumentsSchema } from './input-schema';
import { getTokenAddress } from './function';

import type { SolanaAction } from '../../solana-action';
import type { GetTokenAddressResultBodyType } from './types';

export class SolanaGetTokenAddressAction
  implements SolanaAction<typeof GetTokenAddressArgumentsSchema, GetTokenAddressResultBodyType>
{
  public name = SOLANA_GET_TOKEN_ADDRESS_ACTION;
  public description = SOLANA_GET_TOKEN_ADDRESS_PROMPT;
  public argsSchema = GetTokenAddressArgumentsSchema;
  public func = getTokenAddress;
}
