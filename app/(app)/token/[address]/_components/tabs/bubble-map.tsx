'use client'

import React, { useState, useEffect } from 'react'
import { useChain } from '@/app/_contexts/chain-context'
import { useSearchParams } from 'next/navigation'
import { ChainType } from '@/app/_contexts/chain-context'
import { Skeleton } from '@/components/ui'

interface Props {
    address: string
}

export const BubbleMap: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;

    // Map chain to the correct chain identifier for BubbleMaps URL
    const chainIdentifier = chain === 'solana' ? 'sol' : chain === 'bsc' ? 'bsc' : 'base';
    
    useEffect(() => {
        const checkAvailability = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://api-legacy.bubblemaps.io/map-availability?chain=${chainIdentifier}&token=${address}`);
                const data = await response.json();
                
                if (data.status === "OK") {
                    setIsAvailable(data.availability);
                } else {
                    setIsAvailable(false);
                }
            } catch (error) {
                console.error("Error checking bubble map availability:", error);
                setIsAvailable(false);
            } finally {
                setIsLoading(false);
            }
        };
        
        checkAvailability();
    }, [address, chainIdentifier]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full p-4">
                <Skeleton className="w-full h-full" />
            </div>
        );
    }
    
    if (isAvailable === false) {
        return (
            <div className="flex items-center justify-center h-full w-full p-4">
                <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                        Bubble Map Not Available
                    </h3>
                    <p className="text-sm text-neutral-500">
                        Bubble maps are not available for this token. This could be because the token is too new or has limited on-chain activity.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <iframe 
            className="w-full h-full max-w-full"
            src={`https://app.bubblemaps.io/${chainIdentifier}/token/${address}`} 
        />
    )
}

export default BubbleMap