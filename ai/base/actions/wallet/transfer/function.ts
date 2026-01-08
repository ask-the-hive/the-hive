import type { TransferArgumentsType, TransferResultBodyType } from './types';
import type { BaseActionResult } from '../../base-action';
import { BaseGetTokenAddressAction } from '../../token/get-token-address';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function transfer(
  args: TransferArgumentsType,
): Promise<BaseActionResult<TransferResultBodyType>> {
  try {
    if (args.tokenSymbol && !args.tokenAddress) {
      console.log(`Getting address for token symbol: ${args.tokenSymbol}`);
      const getTokenAddressAction = new BaseGetTokenAddressAction();
      const result = await getTokenAddressAction.func({ keyword: args.tokenSymbol });

      if (!result.body?.address) {
        return {
          message: `Could not find token address for symbol: ${args.tokenSymbol}`,
          body: {
            success: false,
            error: `Could not find token address for symbol: ${args.tokenSymbol}`,
          },
        };
      }
      args.tokenAddress = result.body.address;
    }

    if (!args.to || !args.to.startsWith('0x')) {
      return {
        message: 'Invalid recipient address',
        body: {
          success: false,
          error: 'Invalid recipient address',
        },
      };
    }

    if (!args.amount || args.amount <= 0) {
      return {
        message: 'Invalid amount',
        body: {
          success: false,
          error: 'Invalid amount',
        },
      };
    }

    return {
      message: 'Ready to transfer',
      body: {
        success: false,
        amount: args.amount.toString(),
        to: args.to,
        token: args.tokenAddress || 'ETH',
        walletAddress: args.walletAddress,
      },
    };
  } catch (error) {
    console.error('Error in transfer function:', error);
    return {
      message: toUserFacingErrorTextWithContext("Couldn't prepare that transfer right now.", error),
      body: {
        success: false,
        error: toUserFacingErrorTextWithContext("Couldn't prepare that transfer right now.", error),
      },
    };
  }
}
