import useSWR from 'swr';

import { Price } from '@/services/birdeye/types';

export const usePrice = (mint: string) => {
    const shouldFetch = !!mint;
    const { data, isLoading, error, mutate } = useSWR<Price>(
        shouldFetch ? `/api/token/${mint}/price` : null,
        async (url: string) => fetch(url).then(res => res.json())
    );

    return { 
        data, 
        isLoading, 
        error, 
        mutate 
    };
} 
