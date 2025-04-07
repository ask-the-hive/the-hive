"use client"

import { useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import type { SearchResultItem } from "@/services/birdeye/types";
import { ChainType } from '@/app/_contexts/chain-context';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const useSearchTokens = (query: string, chainOverride?: ChainType) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainOverride || (chainParam && (chainParam === 'solana' || chainParam === 'bsc')
        ? chainParam
        : currentChain);

    const { data, error, isLoading } = useSWR(
        query.length > 0 ? `/api/token/search?query=${encodeURIComponent(query)}&chain=${chain}` : null,
        fetcher
    );

    return {
        tokens: data?.tokens || [],
        isLoading,
        error
    };
};