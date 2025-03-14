"use client";

import useSWR from 'swr';

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { useChain } from '@/app/_contexts/chain-context';

export const useNativeBalance = (address: string) => {
    const { currentChain } = useChain();

    return useSWR(
        address ? ['native-balance', address, currentChain] : null,
        async ([, chainAddress]) => {
            try {
                if (currentChain === 'solana') {
                    // Solana native balance
                    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
                    const balance = await connection.getBalance(new PublicKey(chainAddress));
                    return balance / LAMPORTS_PER_SOL;
                } else {
                    // BSC native balance
                    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/');
                    const balance = await provider.getBalance(chainAddress);
                    return Number(ethers.formatEther(balance));
                }
            } catch (error) {
                console.error('Error fetching native balance:', error);
                return 0;
            }
        },
        {
            refreshInterval: 10000, // Refresh every 10 seconds
        }
    );
};