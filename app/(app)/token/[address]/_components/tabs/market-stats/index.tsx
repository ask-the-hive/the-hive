"use client"

import React from 'react'

import { Skeleton } from '@/components/ui';

import TimeStats from './time-stats';

import { useTokenOverview } from '@/hooks';

interface Props {
    address: string;
}

const MarketStats: React.FC<Props> = ({ address }) => {
    const { data: tokenOverview, isLoading } = useTokenOverview(address);

    if(isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    return (
        <div className='flex flex-col gap-2 h-full max-h-full overflow-y-auto no-scrollbar'>
            {
                tokenOverview ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <StatItem label="Market Cap" value={tokenOverview.marketCap} prefix="$" />
                            <StatItem label="Liquidity" value={tokenOverview.liquidity} prefix="$" />
                            <StatItem label="# of Holders" value={tokenOverview.holder} />
                            <StatItem label="# of Markets" value={tokenOverview.numberMarkets} />
                        </div>
                        <TimeStats token={tokenOverview} />
                    </>
                ) : (
                    <p className="text-sm text-neutral-500">
                        No data available
                    </p>
                )
            }
        </div>
    )
}

interface StatItemProps {
    label: string;
    value: number | undefined;
    formatOptions?: Intl.NumberFormatOptions;
    prefix?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, formatOptions = {}, prefix = '' }) => {
    return (
        <div className="flex flex-col border rounded-md p-2 border-neutral-200 dark:border-neutral-700">
            <h3 className="text-xs font-semibold">
                {label}
            </h3>
            <p className="text-sm">
                {value !== undefined && value !== null 
                    ? `${prefix}${value.toLocaleString(undefined, { notation: 'compact', ...formatOptions })}`
                    : `${prefix}N/A`
                }
            </p>
        </div>
    );
};

export default MarketStats