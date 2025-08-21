import { Connection } from "@solana/web3.js";
import { getToken } from "@/db/services";

import type { StakeArgumentsType, StakeResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";

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
  args: StakeArgumentsType
): Promise<SolanaActionResult<StakeResultBodyType>> {
  try {
    // SOL mint address
    const SOL_MINT = "So11111111111111111111111111111111111111112";
    
    // Get token data for the liquid staking token
    const outputToken = await getToken(args.contractAddress);
    if (!outputToken) {
      return {
        message: `Error: Could not find token data for contract address ${args.contractAddress}`,
      };
    }

    const amount = args.amount || 1; // Default to 1 SOL if not specified

    // Return the data needed for the Swap component to execute the staking
    return {
      message: `Ready to stake ${amount} SOL for ${outputToken.symbol}. The Swap component will handle getting quotes and executing the transaction.`,
      body: {
        tx: "", // Will be filled by the UI component after transaction execution
        symbol: outputToken.symbol,
        amount: amount
      }
    };

  } catch (error) {
    console.error("Error in stakeSol:", error);
    return {
      message: `Error preparing staking: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
