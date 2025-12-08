import useSWR from 'swr';

import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as Sentry from '@sentry/nextjs';
import { SOL_MINT } from '@/lib/constants';

const connectionCache: Record<string, Connection> = {};

const getConnection = (rpcUrl: string) => {
  if (!connectionCache[rpcUrl]) {
    connectionCache[rpcUrl] = new Connection(rpcUrl);
  }
  return connectionCache[rpcUrl];
};

/**
 * Retrieves the balance for a Solana mint (including token-2022) or native SOL.
 * @param tokenAddress Base58 mint address, or SOL pseudo mint.
 * @param walletAddress Owner wallet address.
 * @returns Numeric balance and loading state.
 */
export const useTokenBalance = (tokenAddress: string, walletAddress: string) => {
  const shouldFetch = !!tokenAddress && !!walletAddress;

  const { data, isLoading } = useSWR<number | null>(
    shouldFetch ? `token-balance-${tokenAddress}-${walletAddress}` : null,
    async () => {
      const connection = getConnection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

      if (tokenAddress === SOL_MINT) {
        const balance =
          (await connection.getBalance(new PublicKey(walletAddress))) / LAMPORTS_PER_SOL;
        return balance;
      }

      if (tokenAddress.length < 32 || tokenAddress.length > 44) {
        return null;
      }

      const mint = new PublicKey(tokenAddress);
      const owner = new PublicKey(walletAddress);

      try {
        const ata2022 = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
        const balance2022 = await connection.getTokenAccountBalance(ata2022);
        return balance2022.value.uiAmount ?? 0;
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            tokenAddress,
            walletAddress,
            context: 'useTokenBalance token-2022 ATA lookup',
          },
        });
      }

      try {
        const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID);
        const balance = await connection.getTokenAccountBalance(ata);
        return balance.value.uiAmount ?? 0;
      } catch (error) {
        Sentry.captureException(error, {
          extra: {
            tokenAddress,
            walletAddress,
            context: 'useTokenBalance SPL ATA lookup',
          },
        });
        return null;
      }
    },
  );

  return {
    balance: data ?? 0,
    isLoading,
  };
};
