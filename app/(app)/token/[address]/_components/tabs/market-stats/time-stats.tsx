'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui'

import BuySell from '@/app/(app)/_components/buy-sell'

import { cn } from '@/lib/utils'

import type { TokenOverview } from '@/services/birdeye/types'

interface Props {
    token: TokenOverview
}

enum TimePeriod {
    '5M' = '30m',
    '1H' = '1h',
    '4H' = '4h',
    '24H' = '24h'
}

const TimeStats: React.FC<Props> = ({ token }) => {

    const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod['24H'])

    const getPriceChange = (period: TimePeriod) => {
        switch(period) {
            case '30m':
                return token.priceChange30mPercent || 0
            case '1h':
                return token.priceChange1hPercent || 0
            case '4h':
                return token.priceChange4hPercent || 0
            case '24h':
                return token.priceChange24hPercent || 0
            default:
                return 0
        }
    }

    const getTransactions = (period: TimePeriod) => {
        const buys = token[`buy${period}`] || 0
        const sells = token[`sell${period}`] || 0
        return {
            total: buys + sells,
            buys,
            sells
        }
    }

    const getVolume = (period: TimePeriod) => {
        const buyVol = token[`vBuy${period}USD`] || 0
        const sellVol = token[`vSell${period}USD`] || 0
        return {
            total: buyVol + sellVol,
            buyVol,
            sellVol
        }
    }

    const getMakers = (period: TimePeriod) => {
        const buyers = token[`uniqueWallet${period}`] || 0
        const sellers = token[`uniqueWallet${period}`] || 0
        return {
            total: buyers + sellers,
            buyers,
            sellers
        }
    }

    const transactions = getTransactions(timePeriod)
    const volume = getVolume(timePeriod)
    const makers = getMakers(timePeriod)

    return (
        <div className="flex flex-col border rounded-md border-neutral-200 dark:border-neutral-700">
            <div className="flex w-full border-b border-neutral-200 dark:border-neutral-700">
                {
                    Object.entries(TimePeriod).map(([label, period]) => {
                        const change = getPriceChange(period)
                        return (
                            <Button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                variant={"ghost"}
                                className={cn(
                                    "flex flex-col items-center h-fit p-2 flex-1 gap-0 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 rounded-none", 
                                    timePeriod === period && 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                )}
                            >
                                <span>{label}</span>
                                <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </span>
                            </Button>
                        )
                    })
                }
            </div>
            <div className="flex flex-col px-2">
                {/* Transactions */}
                <StatSection
                    label="TXNS"
                    total={transactions.total.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 0 })}
                    buy={transactions.buys}
                    sell={transactions.sells}
                    buyLabel="BUYS"
                    sellLabel="SELLS"
                />

                {/* Volume */}
                <StatSection
                    label="VOLUME"
                    total={volume.total.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 0 })}
                    buy={volume.buyVol}
                    sell={volume.sellVol}
                    buyLabel="BUY VOL"
                    sellLabel="SELL VOL"
                    prefix="$"
                />

                {/* Makers */}
                <StatSection
                    label="MAKERS"
                    total={makers.total.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 0 })}
                    buy={makers.buyers}
                    sell={makers.sellers}
                    buyLabel="BUYERS"
                    sellLabel="SELLERS"
                />
            </div>
        </div>
    )
}

interface StatSectionProps {
    label: string
    total: number | string
    buy: number
    sell: number
    buyLabel?: string
    sellLabel?: string
    prefix?: string
}

const StatSection: React.FC<StatSectionProps> = ({
    label,
    total,
    buy,
    sell,
    buyLabel,
    sellLabel,
    prefix = '',
}) => {
    return (
        <div className="flex gap-2 items-center h-16">
            <div className="flex flex-col w-24">
                <h3 className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold">{label}</h3>
                <p className="text-lg font-semibold">{prefix}{total}</p>
            </div>
            <div className="h-full w-[1px] bg-neutral-100 dark:bg-neutral-700" />
            <BuySell
                buy={buy}
                sell={sell}
                buyLabel={buyLabel}
                sellLabel={sellLabel}
                prefix={prefix}
            />
        </div>
    )
}

export default TimeStats