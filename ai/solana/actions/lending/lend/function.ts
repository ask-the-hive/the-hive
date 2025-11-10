import type { LendArgumentsType, LendResultType } from './types';

export async function lend(args: LendArgumentsType): Promise<LendResultType> {
  // This function returns immediately with the call arguments
  // The actual lending happens in the UI component after user confirmation
    return {
    message: `CRITICAL: The lending UI is now showing with status='pending'. The user has NOT initiated the transaction yet. You MUST provide a step-by-step explanation of how to complete the lending process. DO NOT say "transaction is pending" or "lending is pending". Instead, explain the 6-step process from the prompt.`,
      body: {
      status: 'pending',
      tx: '',
        amount: args.amount || 0,
      },
    };
}
