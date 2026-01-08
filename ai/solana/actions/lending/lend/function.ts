import type { LendArgumentsType, LendResultType } from './types';
import { isSupportedSolanaLendingStablecoin } from '@/lib/yield-support';

export async function lend(args: LendArgumentsType): Promise<LendResultType> {
  // Allow the UI to render even if the model omitted some arguments.
  // The UI can recover from the user's message or cached pool selection.
  if (!args.tokenSymbol || !args.protocol || !args.tokenAddress) {
    return {
      message:
        "CRITICAL: The lending UI is now showing with status='pending'. The user has NOT initiated the transaction yet. Provide brief next-step guidance without claiming the transaction started.",
      body: {
        status: 'pending',
        tx: '',
        amount: args.amount || 0,
      },
    };
  }

  if (!isSupportedSolanaLendingStablecoin(args.tokenSymbol)) {
    return {
      message:
        "That token isn't supported for lending in this app. Pick a supported stablecoin lending pool to continue.",
      body: {
        status: 'failed',
        tx: '',
        amount: args.amount || 0,
      },
    };
  }

  return {
    message: `CRITICAL: The lending UI is now showing with status='pending'. The user has NOT initiated the transaction yet. You MUST provide a step-by-step explanation of how to complete the lending process. DO NOT say "transaction is pending" or "lending is pending". Instead, explain the 6-step process from the prompt.`,
    body: {
      status: 'pending',
      tx: '',
      amount: args.amount || 0,
    },
  };
}
