"use client";

import useSWR from "swr";
import { ChainType } from "@/app/_contexts/chain-context";
import { useChain } from "@/app/_contexts/chain-context";

import type { EnrichedTransaction } from "helius-sdk";

export const useTransactions = (address: string, chain?: ChainType) => {
    const { currentChain, walletAddresses } = useChain();
    
    // Use the provided chain or fall back to the current chain
    const effectiveChain = chain || currentChain;
    
    // Use the appropriate address for the current chain
    const chainAddress = effectiveChain === 'solana' 
        ? walletAddresses.solana || address 
        : effectiveChain === 'bsc'
            ? walletAddresses.bsc || address
            : walletAddresses.base || address;
    
    // Only fetch if we have a valid address for the chain
    const shouldFetch = chainAddress && 
                       ((effectiveChain === 'solana' && !chainAddress.startsWith('0x')) ||
                        ((effectiveChain === 'bsc' || effectiveChain === 'base') && chainAddress.startsWith('0x')));
    
    const { data, isLoading, error, mutate } = useSWR<EnrichedTransaction[]>(
        shouldFetch ? `/api/transactions/${chainAddress}?chain=${effectiveChain}` : null,
        async (url: string) => fetch(url).then(res => res.json())
    );

    return { data: data ?? [], isLoading, error, mutate };
}