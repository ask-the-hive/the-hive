"use client"

import React from 'react'

import { Card } from '@/components/ui'

interface Props {
    token: {
        marketCap?: number;
        liquidity?: number;
        holder?: number;
        numberMarkets?: number;
    }
}

const Stats: React.FC<Props> = ({ token }) => {
    return (
        <Card className='p-2 flex flex-col gap-2'>
            <h2 className="text-lg font-semibold">
                Market Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">
                        Market Cap
                    </h3>
                    <p>${token.marketCap ? token.marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">
                        Liquidity
                    </h3>
                    <p>${token.liquidity ? token.liquidity.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">
                        # of Holders
                    </h3>
                    <p>{token.holder ? token.holder.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">
                        # of Markets
                    </h3>
                    <p>{token.numberMarkets ? token.numberMarkets.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}</p>
                </div>
            </div>
        </Card>
    )
}

export default Stats