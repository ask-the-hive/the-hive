"use client";

import useSWR from 'swr';

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { useChain } from '@/app/_contexts/chain-context';

export const useNativeBalance = (address: string) => {
    const { currentChain, walletAddresses } = useChain();

    // Use the appropriate address for the current chain
    const chainAddress = currentChain === 'solana' 
        ? walletAddresses.solana || address 
        : walletAddresses.bsc || address;

    const { data, isLoading, error, mutate } = useSWR(
        chainAddress ? `native-balance/${currentChain}/${chainAddress}` : null,
        async () => {
            try {
                if (currentChain === 'solana') {
                    // Only proceed if we have a valid Solana address
                    if (!chainAddress || chainAddress.startsWith('0x')) {
                        return 0;
                    }
                    
                    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
                    const balance = await connection.getBalance(new PublicKey(chainAddress));
                    return balance / LAMPORTS_PER_SOL;
                } else {
                    // Only proceed if we have a valid BSC address
                    if (!chainAddress || !chainAddress.startsWith('0x')) {
                        return 0;
                    }
                    
                    // BSC native balance
                    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/');
                    const balance = await provider.getBalance(chainAddress);
                    return Number(ethers.formatEther(balance));
                }
            } catch (error) {
                console.error(`Error fetching ${currentChain === 'solana' ? 'SOL' : 'BNB'} balance:`, error);
                return 0;
            }
        }
    );

    return { data: data ?? 0, isLoading, error, mutate };
};