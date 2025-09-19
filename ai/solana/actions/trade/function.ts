import { Connection } from '@solana/web3.js';

import type { SolanaTradeArgumentsType, SolanaTradeResultBodyType } from './types';
import type { SolanaActionResult } from '../solana-action';

/**
 * Prepare trading data for token swaps using Jupiter Exchange.
 * The actual trading transaction will be executed by the Swap component.
 *
 * @param connection - Solana connection
 * @param args - The input arguments for the action
 * @returns A message containing the trading preparation result
 */
export async function tradeTokens(
  connection: Connection,
  args: SolanaTradeArgumentsType,
): Promise<SolanaActionResult<SolanaTradeResultBodyType>> {
  try {
    // Default SOL mint address if no input mint is provided
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    const inputMint = args.inputMint || SOL_MINT;
    const outputMint = args.outputMint || SOL_MINT;
    const inputAmount = args.inputAmount || 1;

    // Return the data needed for the Swap component to execute the trade
    return {
      message: `Ready to trade tokens. The Swap component will handle getting quotes and executing the transaction.`,
      body: {
        transaction: '', // Will be filled by the UI component after transaction execution
        inputAmount: inputAmount,
        inputToken: inputMint,
        outputToken: outputMint,
      },
    };
  } catch (error) {
    console.error('Error in tradeTokens:', error);
    return {
      message: `Error preparing trade: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
