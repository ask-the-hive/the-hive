import { Wallet } from '@coinbase/coinbase-sdk';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';
import type { CdpActionResult } from '@/ai';
import type { GetBalanceArgumentsType, GetBalanceResultBodyType } from './types';

/**
 * Gets balance for all addresses in the wallet for a given asset.
 *
 * @param wallet - The wallet to get the balance for.
 * @param args - The input arguments for the action.
 * @returns A message containing the balance information.
 */
export async function getBalance(
  wallet: Wallet,
  args: GetBalanceArgumentsType,
): Promise<CdpActionResult<GetBalanceResultBodyType>> {
  try {
    const addresses = await wallet.getDefaultAddress();
    const balance = await addresses.getBalance(args.assetId);
    return {
      message: `Balances for wallet ${wallet.getId()}:\n${balance}`,
      body: {
        balance,
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load that balance right now.", error),
    };
  }
}
