"use client"

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import type { TopTraderByToken } from "@/services/birdeye/types";

export const useTopTraders = (address: string) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    const { data, isLoading, error } = useSWR<TopTraderByToken[]>(
        `/api/token/${address}/top-traders?chain=${chain}`, 
        (url: string) => fetch(url).then(res => res.json()),
    );

    return { 
        data: data || [], 
        isLoading,
        error 
    };
}