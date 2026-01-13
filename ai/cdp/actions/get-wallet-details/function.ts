import type { Wallet } from '@coinbase/coinbase-sdk';
import type { CdpActionResult } from '@/ai';
import type { GetWalletDetailsArgumentsType, GetWalletDetailsResultBodyType } from './types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

/**
 * Gets a wallet's details.
 *
 * @param wallet - The wallet to get details from.
 * @param _ - The input arguments for the action.
 * @returns A message containing the wallet details.
 */
export async function getWalletDetails(
  wallet: Wallet,
  _: GetWalletDetailsArgumentsType,
): Promise<CdpActionResult<GetWalletDetailsResultBodyType>> {
  try {
    const defaultAddress = await wallet.getDefaultAddress();
    return {
      message: `Wallet: ${wallet.getId()} on network: ${wallet.getNetworkId()} with default address: ${defaultAddress.getId()}`,
      body: {
        address: defaultAddress.getId(),
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load wallet details right now.", error),
    };
  }
}
