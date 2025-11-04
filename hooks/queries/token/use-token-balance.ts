import useSWR from 'swr';
import { useChain } from '@/app/_contexts/chain-context';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
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
      console.log('=== useTokenBalance DEBUG ===');
      console.log('tokenAddress:', tokenAddress);
      console.log('walletAddress:', walletAddress);
      console.log('chain:', chain);

      if (chain === 'solana') {
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
        if (tokenAddress === 'So11111111111111111111111111111111111111112') {
          const balance =
            (await connection.getBalance(new PublicKey(walletAddress))) / LAMPORTS_PER_SOL;
          return balance;
        } else {
          const token_address = getAssociatedTokenAddressSync(
            new PublicKey(tokenAddress),
            new PublicKey(walletAddress),
          );

          console.log('Calculated ATA:', token_address.toBase58());

          try {
            const token_account = await connection.getTokenAccountBalance(token_address);
            console.log('✅ Successfully fetched token balance:', token_account.value.uiAmount);
            return token_account.value.uiAmount ?? 0;
          } catch (error) {
            console.error('❌ Error getting token account balance:', error);
            return 0;
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
