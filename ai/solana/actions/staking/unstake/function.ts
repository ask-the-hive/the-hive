import { Connection } from '@solana/web3.js';
import { getToken } from '@/db/services';

import type { UnstakeArgumentsType, UnstakeResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';

/**
 * Prepare unstaking data for liquid staking tokens back to SOL.
 * The actual unstaking transaction will be executed by the Swap component.
 *
 * @param connection - Solana connection
 * @param args - The input arguments for the action
 * @returns A message containing the unstaking preparation result
 */
export async function unstakeSol(
  connection: Connection,
  args: UnstakeArgumentsType,
): Promise<SolanaActionResult<UnstakeResultBodyType>> {
  try {
    // If no contract address provided, return guidance only
  if (!args.contractAddress) {
    return {
      message: '',
      body: { status: 'guide' },
    };
  }

    // Get token data for the liquid staking token
    const inputToken = await getToken(args.contractAddress);
    if (!inputToken) {
      return {
        message: `Error: Could not find token data for contract address ${args.contractAddress}`,
      };
    }

    const amount = args.amount || 1; // Default to 1 token if not specified

    // Return the data needed for the Swap component to execute the unstaking
    return {
      message: `Ready to unstake ${amount} ${inputToken.symbol} back to SOL. The Swap component will handle getting quotes and executing the transaction.`,
      body: {
        status: 'pending',
        tx: '', // Will be filled by the UI component after transaction execution
        symbol: inputToken.symbol,
        inputAmount: amount,
      },
    };
  } catch (error) {
    console.error('Error in unstakeSol:', error);
    return {
      message: `Error preparing unstaking: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
