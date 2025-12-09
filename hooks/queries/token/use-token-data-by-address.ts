"use client"

import useSWR from "swr";

import { Token } from "@/db/types";

export const useTokenDataByAddress = (address: string) => {
    const shouldFetch = !!address;
    const { data, isLoading, error } = useSWR<Token | null>(
        shouldFetch ? `/api/token/${address}/data` : null, 
        (url: string) => fetch(url).then(res => res.json()),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    return { 
        data: data || null, 
        isLoading,
        error 
    };
}
