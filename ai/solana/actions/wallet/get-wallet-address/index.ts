import { SOLANA_GET_WALLET_ADDRESS_ACTION } from './name';
import { SOLANA_GET_WALLET_ADDRESS_PROMPT } from './prompt';
import { GetWalletAddressInputSchema } from './input-schema';

import type { GetWalletAddressResultBodyType } from './types';
import type { SolanaAction } from '../../solana-action';

export class SolanaGetWalletAddressAction
  implements SolanaAction<typeof GetWalletAddressInputSchema, GetWalletAddressResultBodyType>
{
  public name = SOLANA_GET_WALLET_ADDRESS_ACTION;
  public description = SOLANA_GET_WALLET_ADDRESS_PROMPT;
  public argsSchema = GetWalletAddressInputSchema;
}
