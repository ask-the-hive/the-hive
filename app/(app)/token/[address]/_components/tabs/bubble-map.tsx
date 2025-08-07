'use client'

import React, { useState, useEffect } from 'react'
import { useChain } from '@/app/_contexts/chain-context'
import { useSearchParams } from 'next/navigation'
import { ChainType } from '@/app/_contexts/chain-context'


interface Props {
    address: string
}

export const BubbleMap: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    const [isLoading, setIsLoading] = useState(true);

    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;

    // Chain mapping is available if needed for future use
    // const chainIdentifier = chain === 'solana' ? 'sol' : chain === 'bsc' ? 'bsc' : 'base';
    
    useEffect(() => {
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const partnerId = process.env.NEXT_PUBLIC_BUBBLE_MAPS_PARTNER_ID;
    if (!partnerId) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Bubble Maps integration is not properly configured
            </div>
        );
    }
    
    return (
        <iframe 
            className="w-full h-full max-w-full"
            src={`https://iframe.bubblemaps.io/map?address=${address}&chain=${chain}&partnerId=${partnerId}`}
            title="Token Bubble Map"
        />
    )
}

export default BubbleMap