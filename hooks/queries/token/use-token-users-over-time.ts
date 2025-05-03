"use client"

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";

import type { TokenUsersOverTimeResponse } from "@/services/hellomoon/types";

export const useTokenUsersOverTime = (mint: string) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const shouldFetch = chain === 'solana';
    
    const { data, isLoading, error } = useSWR<TokenUsersOverTimeResponse | null>(
        shouldFetch ? `/api/token/${mint}/users-over-time` : null, 
        (url: string) => fetch(url).then(res => res.json()).catch(err => {
            console.error(err);
            return null;
        }),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    return { 
        data: data || null, 
        isLoading: shouldFetch && isLoading,
        error,
        chain
    };
}