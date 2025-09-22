import { resolveAssetSymbolToAddress } from '@/services/tokens/resolve-asset-symbol-to-address';

import type { BaseActionResult } from '../../base-action';
import type { GetTokenAddressArgumentsType, GetTokenAddressResultBodyType } from './types';

export async function getTokenAddress(
  args: GetTokenAddressArgumentsType,
): Promise<BaseActionResult<GetTokenAddressResultBodyType>> {
  try {
    const address = await resolveAssetSymbolToAddress(args.keyword, 'base');

    if (!address) {
      throw new Error('Failed to resolve token address');
    }

    return {
      message: `Found token address for ${args.keyword}. The user is shown the following token address in the UI, DO NOT REITERATE THE TOKEN ADDRESS. Ask the user what they want to do next.`,
      body: {
        address,
      },
    };
  } catch (error) {
    return {
      message: `Error getting token data: ${error}`,
    };
  }
}
