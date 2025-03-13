'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChain } from '@/app/_contexts/chain-context';

import SmartMoneyTokenCard from './smart-money-token-card';
import { Skeleton } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

import { ChainType } from '@/app/_contexts/chain-context';
import { SmartMoneyTokenInflow } from '@/services/hellomoon/types';
import { Price, TokenMetadata } from '@/services/birdeye/types';

interface SmartMoneyToken {
    inflow: SmartMoneyTokenInflow;
    price: Price;
    token: TokenMetadata;
}

const SmartMoneyTokens: React.FC = () => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;
        
    const [tokens, setTokens] = useState<SmartMoneyToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Store previously fetched data per chain
    const previousData = useRef<Record<string, SmartMoneyToken[]>>({});

    useEffect(() => {
        const fetchSmartMoneyTokens = async () => {
            // Skip API call for BSC tokens
            if (chain === 'bsc') {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`/api/token/smart-money?chain=${chain}`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch smart money inflows. Please try again later.');
                }
                
                // Store successful response in cache
                previousData.current[chain] = data;
                setTokens(data);
            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                
                // Check if it's a rate limit error
                const isRateLimitError = errorMessage.includes('429') || 
                                        errorMessage.includes('Too Many Requests');
                
                // If we have previous data for this chain and it's a rate limit error, use it
                if (isRateLimitError && previousData.current[chain]) {
                    console.log('Using cached data due to rate limit error');
                    setTokens(previousData.current[chain]);
                    setError('Rate limit exceeded. Showing previously fetched data.');
                } else {
                    // Otherwise show the error and clear tokens
                    setError(errorMessage);
                    setTokens([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSmartMoneyTokens();
    }, [chain]);

    if (chain !== 'solana') {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Smart Money Inflows</h2>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            ) : error && tokens.length > 0 ? (
                <>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md mb-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">Note</h3>
                        </div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{error}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {tokens.map((item) => (
                            <SmartMoneyTokenCard 
                                key={item.inflow.mint} 
                                inflow={item.inflow} 
                                price={item.price} 
                                token={item.token} 
                            />
                        ))}
                    </div>
                </>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <h3 className="font-medium text-red-600 dark:text-red-400">Error</h3>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                </div>
            ) : tokens.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {tokens.map((item) => (
                        <SmartMoneyTokenCard 
                            key={item.inflow.mint} 
                            inflow={item.inflow} 
                            price={item.price} 
                            token={item.token} 
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default SmartMoneyTokens