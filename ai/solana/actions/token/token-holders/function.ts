import type { TokenHoldersArgumentsType, TokenHoldersResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";
import { getTokenAccountsByMint } from "@/services/helius";
import { toUserFacingErrorTextWithContext } from "@/lib/user-facing-error";

export async function getNumHolders(
  args: TokenHoldersArgumentsType
): Promise<SolanaActionResult<TokenHoldersResultBodyType>> {
  try {
    let tokenAccounts = await getTokenAccountsByMint(args.tokenAddress);

    if(args.threshold && args.threshold > 0) {
        tokenAccounts = tokenAccounts.filter(account => account.amount >= args.threshold!);
    }

    return {
      message: `The number of holders have been retrieved and displayed to the user. Now ask them what they want to do next.`,
      body: {
        numHolders: tokenAccounts.length,
      }
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load holder data right now.", error),
    };
  }
} 
