"use client"

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import type { TokenHolder } from "@/services/birdeye/types";

export const useTopHolders = (address: string) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    const { data, isLoading, error, mutate } = useSWR<TokenHolder[]>(
        [`/api/token/${address}/top-holders`, chain], 
        ([url, currentChain]) => fetch(`${url}?chain=${currentChain}`).then(res => res.json()),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 10000, // Dedupe requests within 10 seconds
        }
    );

    return { 
        data: data || [], 
        isLoading,
        error,
        mutate
    };
}