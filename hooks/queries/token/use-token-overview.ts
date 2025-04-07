"use client"

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import type { TokenOverview } from "@/services/birdeye/types";

export const useTokenOverview = (address: string) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    const { data, isLoading, error } = useSWR<TokenOverview | null>(
        `/api/token/${address}/overview?chain=${chain}`, 
        (url: string) => fetch(url).then(res => res.json()),
        {
            refreshInterval: 5000,
        }
    );

    return { 
        data: data || null, 
        isLoading,
        error 
    };
}