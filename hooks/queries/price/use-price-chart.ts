"use client"

import useSWR from 'swr';
import { ChainType } from '@/app/_contexts/chain-context';
import { TokenPriceCandlestick, CandlestickGranularity } from '@/services/hellomoon/types';

export const usePriceChart = (mint: string, timeframe: CandlestickGranularity, numDays: number, chain: ChainType = 'solana') => {

    const { data, isLoading, error, mutate } = useSWR<TokenPriceCandlestick[]>(
        `/api/token/${mint}/prices/${timeframe}/${numDays}/${chain}`,
        async () => fetch(`/api/token/${mint}/prices`, {
            method: 'POST',
            body: JSON.stringify({
                timeframe,
                numDays,
                chain
            })
        }).then(res => res.json()),
        {
            refreshInterval: 5000
        }
    );

    return { 
        data: data || [], 
        isLoading, 
        error, 
        mutate 
    };
} 