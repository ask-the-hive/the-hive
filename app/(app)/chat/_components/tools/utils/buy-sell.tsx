'use client'

import React from 'react'

interface Props {
    buy: number;
    sell: number;
    prefix?: string;
    suffix?: string;
}

const BuySell: React.FC<Props> = ({ buy = 0, sell = 0, prefix = '', suffix = '' }) => {
    const total = buy + sell;
    const buyPercentage = total > 0 ? (buy / total) * 100 : 0;
    const sellPercentage = total > 0 ? (sell / total) * 100 : 0;

    return (
        <div className="flex flex-col w-full gap-1">
            <div className="flex justify-between text-xs">
                <span className="text-red-500">
                    {sellPercentage.toFixed(2)}%
                </span>
                <span className="text-green-500">
                    {buyPercentage.toFixed(2)}%
                </span>
            </div>
            <div className="flex w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                    className="bg-red-500 h-full"
                    style={{ 
                        width: `${sellPercentage}%`
                    }}
                />
                <div 
                    className="bg-green-500 h-full"
                    style={{ 
                        width: `${buyPercentage}%`
                    }}
                />
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-red-500">
                    {prefix}{(sell || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}{suffix}
                </span>
                <span className="text-green-500">
                    {prefix}{(buy || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}{suffix}
                </span>
            </div>
        </div>
    )
}

export default BuySell