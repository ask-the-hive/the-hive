'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'
import type { TrendingToken } from '@/services/birdeye/types'
import Link from 'next/link'
import { useChain } from '@/app/_contexts/chain-context'
import SaveToken from '@/app/(app)/_components/save-token'
import { ChainType } from '@/app/_contexts/chain-context'

interface Props {
    token: TrendingToken & { mentions?: number };
}

const TrendingTokenCard: React.FC<Props> = ({ token }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const placeholderIcon = "https://www.birdeye.so/images/unknown-token-icon.svg";
    
    return (
        <Link href={`/token/${token.address}?chain=${chain}`}>
            <Card className="flex flex-col gap-2 p-2 justify-between hover:border-brand-600 dark:hover:border-brand-600 transition-all duration-300 cursor-pointer h-full relative">
                {/* SaveToken star in top right */}
                <div className="absolute top-2 right-2 z-10">
                    <SaveToken address={token.address} />
                </div>
                <div className="flex flex-row items-center gap-2">
                    <img 
                        src={token.logoURI || placeholderIcon} 
                        alt={token.name} 
                        className="size-8 rounded-full" 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = placeholderIcon;
                        }}
                    />
                    <div className="flex flex-col">
                        <p className="text-sm font-bold">{token.name} ({token.symbol})</p>
                        <p className="text-xs text-muted-foreground">
                            ${token.price?.toLocaleString(undefined, { maximumFractionDigits: 5 }) ?? 'N/A'}
                            {token.price24hChangePercent != null && token.price24hChangePercent !== 0 && (
                                <span className={token.price24hChangePercent > 0 ? 'text-green-500' : 'text-red-500'}>
                                    {' '}({token.price24hChangePercent > 0 ? '+' : ''}{token.price24hChangePercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground">24h Volume: {token.volume24hUSD && token.volume24hUSD !== 0 ? `$${token.volume24hUSD.toLocaleString()}` : 'N/A'}</p>
                </div>
            </Card>
        </Link>
    )
}

export default TrendingTokenCard