'use client'

import React from 'react'

interface Props {
    buy: number;
    sell: number;
    buyLabel?: string;
    sellLabel?: string;
    prefix?: string;
    suffix?: string;
}

const BuySell: React.FC<Props> = ({ buy, sell, buyLabel, sellLabel, prefix, suffix }) => {
    return (
        <div className="flex flex-col w-full gap-1">
            <div className="flex justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">
                    {buyLabel}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                    {sellLabel}
                </span>
            </div>
            <div className="flex w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                    className="bg-green-500 h-full"
                    style={{ 
                        width: `${(buy / (buy + sell)) * 100}%`
                    }}
                />
                <div 
                    className="bg-red-500 h-full"
                    style={{ 
                        width: `${(sell / (buy + sell)) * 100}%`
                    }}
                />
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-green-500">
                    {prefix}{buy.toLocaleString(undefined, { notation: 'compact' })}{suffix}
                </span>
                <span className="text-red-500">
                    {prefix}{sell.toLocaleString(undefined, { notation: 'compact' })}{suffix}
                </span>
            </div>
        </div>
    )
}

export default BuySell