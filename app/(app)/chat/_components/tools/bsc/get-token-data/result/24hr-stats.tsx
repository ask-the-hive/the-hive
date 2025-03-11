"use client"

import React from 'react'

import { Card } from '@/components/ui/card'

import BuySell from '@/app/(app)/chat/_components/tools/utils/buy-sell'

import type { TokenOverview } from '@/services/birdeye/types/token-overview'

interface Props {
    token: TokenOverview
}

const TwentyFourHrStats: React.FC<Props> = ({ token }) => {
    return (
        <Card className='p-2 flex flex-col gap-2'>
            <h2 className="text-lg font-semibold">
                Volume (24hr)
            </h2>
            <BuySell
                buy={token.vBuy24hUSD || 0}
                sell={token.vSell24hUSD || 0}
                prefix="$"
            />
            <div className="flex flex-col">
                <h3 className="text-sm font-semibold">
                    Unique Traders
                </h3>
                <p>{token.uniqueWallet24h?.toLocaleString()} Traders</p>
            </div>
        </Card>
    )
}

export default TwentyFourHrStats 