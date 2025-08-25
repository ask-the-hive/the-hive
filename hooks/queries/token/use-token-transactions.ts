"use client"

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useChain } from "@/app/_contexts/chain-context";
import { ChainType } from "@/app/_contexts/chain-context";
import { TransactionsResponse } from '@/services/birdeye';

interface UseTokenTransactionsParams {
  address: string;
  limit?: number;
  offset?: number;
}

export const useTokenTransactions = ({ 
  address, 
  limit = 20, 
  offset = 0 
}: UseTokenTransactionsParams) => {
  const { currentChain } = useChain();
  const searchParams = useSearchParams();
  const chainParam = searchParams.get('chain') as ChainType | null;
  
  // Use URL param if available, otherwise use context
  const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
    ? chainParam 
    : currentChain;

  const params = new URLSearchParams({
    chain,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const { data, isLoading, error } = useSWR<TransactionsResponse>(
    `/api/token/${address}/transactions?${params}`,
    (url: string) => fetch(url).then(res => res.json()),
  );

  return { 
    data: data || { items: [], hasNext: false }, 
    isLoading,
    error 
  };
};
