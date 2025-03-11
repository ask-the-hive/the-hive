import useSWR from 'swr';
import { ChainType } from '@/app/_contexts/chain-context';
import { useChain } from '@/app/_contexts/chain-context';

import { Portfolio } from '@/services/birdeye/types';

const DEFAULT_ADDRESSES = {
    solana: '11111111111111111111111111111111', // Solana system program
    bsc: '0x0000000000000000000000000000000000000000' // BSC zero address
};

export const usePortfolio = (address: string | undefined, chain: ChainType) => {
    const { currentChain, walletAddresses } = useChain();
    
    // Use the provided chain or fall back to the current chain
    const effectiveChain = chain || currentChain || 'solana';
    
    // If an address is provided, use it directly without falling back to walletAddresses
    const chainAddress = address || (effectiveChain === 'solana' 
        ? walletAddresses.solana || DEFAULT_ADDRESSES.solana
        : walletAddresses.bsc || DEFAULT_ADDRESSES.bsc);
    
    // Only fetch if we have a valid address for the chain
    const shouldFetch = chainAddress && 
                       ((effectiveChain === 'solana' && !chainAddress.startsWith('0x')) ||
                        (effectiveChain === 'bsc' && chainAddress.startsWith('0x')));

    console.log('[Portfolio Debug] Fetch conditions:', {
        chainAddress,
        effectiveChain,
        shouldFetch,
        walletAddresses,
        currentChain
    });
    
    const { data, isLoading, error, mutate } = useSWR<Portfolio>(
        shouldFetch ? `/api/portfolio/${chainAddress}?chain=${effectiveChain}` : null,
        async (url: string) => {
            console.log('[Portfolio Debug] Fetching from URL:', url);
            const response = await fetch(url);
            const json = await response.json();
            console.log('[Portfolio Debug] API Response:', json);
            return json;
        }
    );

    if (error) {
        console.error('[Portfolio Debug] Error fetching portfolio:', error);
    }

    return { 
        data: data, 
        isLoading, 
        error, 
        mutate 
    };
}; 