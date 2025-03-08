'use client'

import React, { useState } from 'react'

import { Skeleton } from '@/components/ui'

import { useTokenDataByAddress } from '@/hooks'
import { useChain } from '@/app/_contexts/chain-context'

import { cn } from '@/lib/utils'

import type { TokenTransfer as SolanaTokenTransfer } from 'helius-sdk'

// Generic token transfer interface that works for both Solana and BSC
interface GenericTokenTransfer {
    // Solana specific
    mint?: string;
    tokenAmount?: number;
    toUserAccount?: string | null;
    // BSC specific
    token?: {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        logo?: string;
    };
    amount?: number;
    from?: string;
    to?: string;
}

interface Props {
    tokenTransfer: GenericTokenTransfer,
    address: string
}

const DEFAULT_FALLBACK = "https://www.birdeye.so/images/unknown-token-icon.svg";

const TokenTransfer: React.FC<Props> = ({ tokenTransfer, address }) => {
    const { currentChain } = useChain();
    const isSolana = currentChain === 'solana';
    const [imgError, setImgError] = useState(false);

    // For Solana transfers
    if (isSolana && tokenTransfer.mint) {
        const solanaTransfer = tokenTransfer as SolanaTokenTransfer;
        const { data, isLoading } = useTokenDataByAddress(solanaTransfer.mint);

        if (isLoading) return <Skeleton className="w-8 h-4 rounded-full" />;

        const symbol = data?.symbol ? data.symbol.toUpperCase() : "UNKNOWN";

        return (
            <div className="flex items-center gap-2">
                {
                    data ? (
                        <img 
                            src={imgError ? DEFAULT_FALLBACK : data.logoURI} 
                            alt={data.name} 
                            className="w-4 h-4 rounded-full"
                            onError={(e) => {
                                setImgError(true);
                                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK;
                            }}
                        />
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-700" />
                    )
                }
                
                <p className={cn("text-xs", solanaTransfer.toUserAccount === address ? "text-green-500" : "text-red-500")}>
                    {solanaTransfer.toUserAccount === address ? "+" : "-"}
                    {solanaTransfer.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} {symbol}
                </p>
            </div>
        )
    } else {
        // For BSC transfers
        if (!tokenTransfer.token) {
            return null; // Skip if no token data
        }

        const tokenAmount = tokenTransfer.amount || 0;
        const isPositive = tokenAmount > 0;
        const amount = Math.abs(tokenAmount);
        const symbol = tokenTransfer.token?.symbol ? tokenTransfer.token.symbol.toUpperCase() : "UNKNOWN";
        const logo = tokenTransfer.token?.logo || DEFAULT_FALLBACK;

        return (
            <div className="flex items-center gap-2">
                <img 
                    src={imgError ? DEFAULT_FALLBACK : logo} 
                    alt={symbol} 
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                        setImgError(true);
                        (e.target as HTMLImageElement).src = DEFAULT_FALLBACK;
                    }}
                />
                
                <p className={cn("text-xs", isPositive ? "text-green-500" : "text-red-500")}>
                    {isPositive ? "+" : "-"}
                    {amount.toLocaleString(undefined, { maximumFractionDigits: 5, minimumFractionDigits: 2 })} {symbol}
                </p>
            </div>
        )
    }
}

export default TokenTransfer