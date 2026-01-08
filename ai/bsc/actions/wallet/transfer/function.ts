import type { TransferArgumentsType, TransferResultBodyType } from './types';
import type { BscActionResult } from '../../bsc-action';
import { BscGetTokenAddressAction } from '../../token/get-token-address';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function transfer(
  args: TransferArgumentsType,
): Promise<BscActionResult<TransferResultBodyType>> {
  try {
    let tokenAddress = args.tokenAddress;
    const tokenSymbol = args.tokenSymbol;

    if (!tokenAddress && tokenSymbol) {
      const getTokenAddressAction = new BscGetTokenAddressAction();
      const result = await getTokenAddressAction.func({ keyword: tokenSymbol });

      if (!result.body?.address) {
        return {
          message: `Could not find token address for symbol: ${tokenSymbol}`,
          body: {
            error: `Could not find token address for symbol: ${tokenSymbol}`,
            cancelled: true,
          },
        };
      }
      tokenAddress = result.body.address;
    }

    return {
      message: `Please confirm the transfer of ${args.amount} ${tokenSymbol || 'BNB'} to ${args.to}`,
      body: {
        amount: args.amount,
        recipient: args.to,
        token: tokenSymbol || 'BNB',
        transaction: '',
        walletAddress: args.walletAddress,
      },
    };
  } catch (error) {
    console.error('Transfer error:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't prepare that transfer right now.", error),
      body: {
        error: toUserFacingErrorTextWithContext("Couldn't prepare that transfer right now.", error),
        cancelled: true,
      },
    };
  }
}
