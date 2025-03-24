import useSWR from 'swr';
import { useChain } from '@/app/_contexts/chain-context';

import { TokenAccount } from '@/services/helius';
import { Token } from '@/db/types';

const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch token accounts');
    }
    return response.json();
};

export const useTokenAccounts = (address: string | undefined) => {
    const { currentChain, walletAddresses } = useChain();
    
    // Use the appropriate address for the current chain
    const chainAddress = address && currentChain === 'solana' 
        ? walletAddresses.solana || address 
        : undefined;
    
    // Only fetch token accounts for Solana and only if we have a valid Solana address
    const shouldFetch = chainAddress && 
                       currentChain === 'solana' && 
                       !chainAddress.startsWith('0x');
    
    const { data, isLoading, error, mutate } = useSWR<(TokenAccount & { token_data: Token, price: number })[]>(
        shouldFetch ? `/api/token-accounts/owner/${chainAddress}` : null,
        fetcher
    );

    return { 
        data: data ?? [], 
        isLoading, 
        error, 
        mutate 
    };
} 