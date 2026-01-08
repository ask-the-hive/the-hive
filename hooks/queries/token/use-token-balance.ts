import useSWR from 'swr';
import { useChain } from '@/app/_contexts/chain-context';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import * as Sentry from '@sentry/nextjs';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const isSolanaTokenAccountMissingError = (error: unknown): boolean => {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as any)?.message === 'string'
        ? (error as any).message
        : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('could not find account') ||
    lower.includes('account does not exist') ||
    lower.includes('invalid param') && lower.includes('could not find account')
  );
};

export const useTokenBalance = (tokenAddress: string, walletAddress: string) => {
  const { currentChain: chain } = useChain();

  const { data, isLoading } = useSWR<number | null>(
    tokenAddress && walletAddress
      ? `token-balance-${chain}-${tokenAddress}-${walletAddress}`
      : null,
    async () => {
      if (chain === 'solana') {
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
        if (tokenAddress === 'So11111111111111111111111111111111111111112') {
          const owner = new PublicKey(walletAddress);

          const nativeLamports = await connection.getBalance(owner);
          const nativeSol = nativeLamports / LAMPORTS_PER_SOL;

          let wrappedSol = 0;

          try {
            const wsolAta = getAssociatedTokenAddressSync(
              new PublicKey(tokenAddress),
              owner,
              false,
              TOKEN_PROGRAM_ID,
            );
            const wsolAccount = await connection.getTokenAccountBalance(wsolAta);
            wrappedSol = wsolAccount.value.uiAmount ?? 0;
          } catch (error) {
            Sentry.captureException(error, {
              extra: {
                tokenAddress,
                walletAddress,
                chain,
                context: 'useTokenBalance wSOL ATA lookup',
              },
            });
          }

          return nativeSol + wrappedSol;
        } else {
          // Basic validation: if tokenAddress is not a valid base58 pubkey length, return null so UI can show '--'
          if (tokenAddress.length < 32 || tokenAddress.length > 44) {
            return null;
          }

          // Try Token-2022 first, then fall back to regular SPL Token
          try {
            const token_address = getAssociatedTokenAddressSync(
              new PublicKey(tokenAddress),
              new PublicKey(walletAddress),
              false,
              TOKEN_2022_PROGRAM_ID,
            );

            const token_account_2022 = await connection.getTokenAccountBalance(token_address);
            return token_account_2022.value.uiAmount ?? 0;
          } catch (error) {
            Sentry.captureException(error, {
              extra: {
                tokenAddress,
                walletAddress,
                chain,
                context: 'useTokenBalance token-2022 ATA lookup',
              },
            });
            try {
              const token_address = getAssociatedTokenAddressSync(
                new PublicKey(tokenAddress),
                new PublicKey(walletAddress),
                false,
                TOKEN_PROGRAM_ID,
              );
              const token_account = await connection.getTokenAccountBalance(token_address);
              return token_account.value.uiAmount ?? 0;
            } catch (err) {
              if (isSolanaTokenAccountMissingError(err)) {
                // Missing ATA is a normal "0 balance" state on Solana.
                return 0;
              }
              Sentry.captureException(err, {
                extra: {
                  tokenAddress,
                  walletAddress,
                  chain,
                  context: 'useTokenBalance SPL ATA lookup',
                },
              });
              return null;
            }
          }
        }
      } else {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
          const balance = await provider.getBalance(walletAddress);
          return Number(ethers.formatEther(balance));
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, decimals] = await Promise.all([
            contract.balanceOf(walletAddress),
            contract.decimals(),
          ]);
          return Number(ethers.formatUnits(balance, decimals));
        }
      }
    },
    {
      // Keep balances up-to-date without requiring a tab focus event.
      // `isLoading` only applies to the first fetch; periodic refreshes won't cause UI skeletons.
      refreshInterval: chain === 'solana' ? 15_000 : 0,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  return {
    balance: data ?? null,
    isLoading,
  };
};
