'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'
import SaveToken from '@/app/(app)/_components/save-token'
import { useChain } from '@/app/_contexts/chain-context'
import { ChainType } from '@/app/_contexts/chain-context'

import type { SmartMoneyTokenInflow } from '@/services/hellomoon/types'
import type { Price, TokenMetadata } from '@/services/birdeye/types'

interface Props {
    inflow: SmartMoneyTokenInflow;
    token: TokenMetadata;
    price: Price;
}

const SmartMoneyTokenCard: React.FC<Props> = ({ inflow, token, price }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    const placeholderIcon = "https://www.birdeye.so/images/unknown-token-icon.svg";

    return (
        <Link href={`/token/${token.address}?chain=${chain}`}>
            <Card className="flex flex-col gap-2 p-2 justify-between hover:border-brand-600 dark:hover:border-brand-600 transition-all duration-300 cursor-pointer h-full">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-2">
                        <img 
                            src={token.logo_uri || placeholderIcon} 
                            alt={token.name} 
                            className="size-8 rounded-full"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = placeholderIcon;
                            }}
                        />
                        <div className="flex flex-col">
                            <p className="text-sm font-bold">{token.name} ({token.symbol})</p>
                            <p className="text-xs text-muted-foreground">
                                ${(price?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 5})} 
                                {price?.priceChange24h !== undefined && price.priceChange24h !== 0 && (
                                    <span className={price.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}>
                                        ({price.priceChange24h > 0 ? '+' : ''}
                                        {price.priceChange24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <SaveToken address={token.address} />
                </div>
                <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground">Net inflow: ${(inflow?.smartMoneyNetInflow || 0).toLocaleString()}</p>
                </div>
            </Card>
        </Link>
    )
}

export default SmartMoneyTokenCard