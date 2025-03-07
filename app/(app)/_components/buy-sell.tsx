'use client'

import React from 'react'

interface Props {
    buy: number | undefined;
    sell: number | undefined;
    buyLabel?: string;
    sellLabel?: string;
    prefix?: string;
    suffix?: string;
}

const BuySell: React.FC<Props> = ({ 
    buy = 0, 
    sell = 0, 
    buyLabel = 'Buy', 
    sellLabel = 'Sell', 
    prefix = '', 
    suffix = '' 
}) => {
    const buyValue = buy || 0;
    const sellValue = sell || 0;
    const total = buyValue + sellValue;
    const buyPercentage = total > 0 ? (buyValue / total) * 100 : 50;
    const sellPercentage = total > 0 ? (sellValue / total) * 100 : 50;

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
                        width: `${buyPercentage}%`
                    }}
                />
                <div 
                    className="bg-red-500 h-full"
                    style={{ 
                        width: `${sellPercentage}%`
                    }}
                />
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-green-500">
                    {prefix}{buyValue.toLocaleString(undefined, { notation: 'compact' })}{suffix}
                </span>
                <span className="text-red-500">
                    {prefix}{sellValue.toLocaleString(undefined, { notation: 'compact' })}{suffix}
                </span>
            </div>
        </div>
    )
}

export default BuySell