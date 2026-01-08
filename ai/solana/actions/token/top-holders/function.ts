import type { TopHoldersArgumentsType, TopHoldersResultBodyType } from "./types";
import type { SolanaActionResult } from "../../solana-action";
import { getTokenLargestAccounts } from "@/services/helius";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { toUserFacingErrorTextWithContext } from "@/lib/user-facing-error";

export async function getTopHolders(
  args: TopHoldersArgumentsType
): Promise<SolanaActionResult<TopHoldersResultBodyType>> {
  try {
    let topHolders = await getTokenLargestAccounts(args.tokenAddress);

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
    await Promise.all(topHolders.map(async (holder) => {
      const tokenAccount = await getAccount(connection, new PublicKey(holder.address));
    }));

    const mintInfo = await connection.getTokenSupply(new PublicKey(args.tokenAddress));
    const totalSupply = Number(BigInt(mintInfo.value.amount) / BigInt(Math.pow(10, mintInfo.value.decimals)));

    return {
      message: `The top holders have been retrieved and displayed to the user. Now ask them what they want to do next.`,
      body: {
        topHolders: await Promise.all(topHolders.map(async (holder) => {
          const tokenAccount = await getAccount(connection, new PublicKey(holder.address));
          return {
            ...holder,
            owner: tokenAccount.owner.toString(),
            percentageOwned: (holder.uiAmount / totalSupply) * 100
          }
        })),
        percentageOwned: topHolders.reduce((acc, holder) => acc + Number(holder.uiAmount), 0) / totalSupply
      }
    };
  } catch (error) {
    return {
      message: toUserFacingErrorTextWithContext("Couldn't load top holders right now.", error),
    };
  }
} 
