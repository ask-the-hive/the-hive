import { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import { LendArgumentsType, LendResultBodyType } from './schema';

export async function lend(
  args: LendArgumentsType,
): Promise<SolanaActionResult<LendResultBodyType>> {
  try {
    // TODO: Implement actual lending transaction
    // For now, return a success message as a stub

    return {
      message: `Successfully lent ${args.amount} ${args.tokenAddress} to protocol ${args.protocolAddress}`,
      body: {
        success: true,
        transactionHash: 'stubbed-transaction-hash',
        amount: args.amount,
        tokenSymbol: args.tokenAddress, // TODO: Get actual symbol from token address
        protocolName: args.protocolAddress, // TODO: Get actual protocol name
      },
    };
  } catch (error) {
    console.error('Error executing lend:', error);
    return {
      message: `Failed to execute lend: ${error}`,
      body: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        amount: args.amount,
        tokenSymbol: args.tokenAddress,
        protocolName: args.protocolAddress,
      },
    };
  }
}
