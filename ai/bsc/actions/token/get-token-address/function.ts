import { resolveAssetSymbolToAddress } from '@/services/tokens/resolve-asset-symbol-to-address';

import type { BscActionResult } from '../../bsc-action';
import type { GetTokenAddressArgumentsType, GetTokenAddressResultBodyType } from './types';

export async function getTokenAddress(
  args: GetTokenAddressArgumentsType,
): Promise<BscActionResult<GetTokenAddressResultBodyType>> {
  try {
    const address = await resolveAssetSymbolToAddress(args.keyword, 'bsc');

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
