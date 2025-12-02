import useSWR from 'swr';
import { useChain } from '@/app/_contexts/chain-context';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const useTokenBalance = (tokenAddress: string, walletAddress: string) => {
  const { currentChain: chain } = useChain();

  const { data, isLoading } = useSWR<number>(
    tokenAddress && walletAddress
      ? `token-balance-${chain}-${tokenAddress}-${walletAddress}`
      : null,
    async () => {
      if (chain === 'solana') {
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
        if (tokenAddress === 'So11111111111111111111111111111111111111112') {
          const balance =
            (await connection.getBalance(new PublicKey(walletAddress))) / LAMPORTS_PER_SOL;
          return balance;
        } else {
          // Basic validation: if tokenAddress is not a valid base58 pubkey length, return 0
          if (tokenAddress.length < 32 || tokenAddress.length > 44) {
            return 0;
          }

          // Try Token-2022 first, then fall back to regular SPL Token
          try {
            let token_address = getAssociatedTokenAddressSync(
              new PublicKey(tokenAddress),
              new PublicKey(walletAddress),
              false,
              TOKEN_2022_PROGRAM_ID,
            );

            const token_account_2022 = await connection.getTokenAccountBalance(token_address);
            return token_account_2022.value.uiAmount ?? 0;
          } catch {
            try {
              const token_address = getAssociatedTokenAddressSync(
                new PublicKey(tokenAddress),
                new PublicKey(walletAddress),
                false,
                TOKEN_PROGRAM_ID,
              );
              const token_account = await connection.getTokenAccountBalance(token_address);
              return token_account.value.uiAmount ?? 0;
            } catch {
              return 0;
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
  );

  return {
    balance: data || 0,
    isLoading,
  };
};
