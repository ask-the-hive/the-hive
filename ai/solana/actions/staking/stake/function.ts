import { Connection } from '@solana/web3.js';
import { getToken } from '@/db/services';
import { isSupportedSolanaStakingLst } from '@/lib/yield-support';
import type { StakeArgumentsType, StakeResultBodyType } from './types';
import type { SolanaActionResult } from '../../solana-action';

/**
 * Prepare staking data for SOL to liquid staking tokens.
 * The actual staking transaction will be executed by the Swap component.
 *
 * @param connection - Solana connection
 * @param args - The input arguments for the action
 * @returns A message containing the staking preparation result
 */
export async function stakeSol(
  connection: Connection,
  args: StakeArgumentsType,
): Promise<SolanaActionResult<StakeResultBodyType>> {
  try {
    const outputToken = await getToken(args.contractAddress);
    if (!outputToken) {
      return {
        message:
          "Couldn't find that staking option. Please pick a SOL staking pool card above to continue.",
        body: {
          status: 'failed',
          tx: '',
          symbol: '',
        },
      };
    }

    if (!isSupportedSolanaStakingLst(outputToken.symbol)) {
      return {
        message:
          `${outputToken.symbol} isn’t a supported SOL liquid-staking token here. ` +
          `Liquid staking supports SOL → LSTs (e.g., DSOL/JUPSOL/JITOSOL/MSOL). ` +
          `If you’re trying to earn yield on ${outputToken.symbol}, use stablecoin lending instead.`,
        body: {
          status: 'failed',
          tx: '',
          symbol: outputToken.symbol,
          contractAddress: args.contractAddress,
        },
      };
    }

    const amount = args.amount || 1;

    return {
      message: `Ready to stake ${amount} SOL for ${outputToken.symbol}. The Swap component will handle getting quotes and executing the transaction.`,
      body: {
        status: 'pending',
        tx: '',
        symbol: outputToken.symbol,
        amount: amount,
        contractAddress: args.contractAddress,
      },
    };
  } catch (error) {
    console.error('Error in stakeSol:', error);
    return {
      message: 'Something went wrong while preparing staking. Please try again.',
      body: {
        status: 'failed',
        tx: '',
        symbol: '',
      },
    };
  }
}
