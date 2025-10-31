import type { LendArgumentsType, LendResultType } from './types';

export async function lend(args: LendArgumentsType): Promise<LendResultType> {
  // This function returns immediately with the call arguments
  // The actual lending happens in the UI component after user confirmation
  return {
    message: `Showing lending interface for ${args.tokenAddress}`,
    body: {
      // Return empty tx to signal this is a "call" state, not a result
      tx: '',
      amount: args.amount || 0,
      // tokenData and poolData will be populated by the UI component
    },
  };
}
