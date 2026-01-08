import { Wallet } from '@coinbase/coinbase-sdk';
import { RequestFaucetFundsArgumentsType, RequestFaucetFundsActionResultType } from './types';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

export async function requestFaucetFunds(
  wallet: Wallet,
  args: RequestFaucetFundsArgumentsType,
): Promise<RequestFaucetFundsActionResultType> {
  try {
    const faucetTx = await wallet.faucet(args.assetId || undefined);

    const result = await faucetTx.wait();

    return {
      message: `Received ${args.assetId || 'ETH'} from the faucet. Transaction: ${result.getTransactionLink()}`,
      body: {
        transactionLink: result.getTransactionLink(),
      },
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't request faucet funds right now.", error),
    };
  }
}
