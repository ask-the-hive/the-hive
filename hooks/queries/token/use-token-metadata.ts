"use client"

import useSWR from "swr";
import { useChain } from "@/app/_contexts/chain-context";

import type { TokenMetadata } from "@/services/birdeye/types";

export const useTokenMetadata = (address: string) => {
    const { currentChain } = useChain();
    
    // Add chain parameter to the API call
    const fetchUrl = address ? `/api/token/${address}/metadata?chain=${currentChain || 'bsc'}` : null;
    
    console.log("Token metadata fetch URL:", fetchUrl);
    
    const fetcher = async (url: string) => {
        console.log("Fetching token metadata from:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Token metadata API response:", data);
            return data;
        } catch (error) {
            console.error("Token metadata fetch error:", error);
            throw error;
        }
    };

    const { data, isLoading, error } = useSWR<TokenMetadata | null>(
        fetchUrl, 
        fetcher,
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