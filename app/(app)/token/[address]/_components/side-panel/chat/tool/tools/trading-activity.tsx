'use client'

import React from 'react'

import ToolCard from '../base';

import type { ToolInvocation } from 'ai';
import type { SolanaActionResult } from '@/ai/solana/actions/solana-action';
import type { TokenPageTradingActivityResultBodyType } from '@/ai/token-page/actions/bsc-trading-activity/function';

// Define the result type based on the SolanaActionResult and the body type
type TokenPageTradingActivityResultType = SolanaActionResult<TokenPageTradingActivityResultBodyType>;

// Define a trader type for the top traders
interface Trader {
  address: string;
  volume: number;
}

interface Props {
    tool: ToolInvocation,
}

const TradingActivity: React.FC<Props> = ({ tool }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText="Analyzing Trading Activity..."
            result={{
                heading: (result: TokenPageTradingActivityResultType) => result.body 
                    ? `Trading Activity Analysis` 
                    : `Failed to Analyze Trading Activity`,
                body: (result: TokenPageTradingActivityResultType) => result.body 
                    ? (
                        <div className="flex flex-col gap-2">
                            <StatsSection title="Volume Metrics">
                                <StatItem 
                                    label="24h Volume"
                                    value={result.body.volume24h}
                                    formatter={formatCurrency}
                                />
                                <StatItem 
                                    label="24h Change"
                                    value={result.body.volumeChange}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                    className={result.body.volumeChange >= 0 ? "text-green-500" : "text-red-500"}
                                    tooltip="Percentage change in trading volume over the last 24 hours"
                                />
                            </StatsSection>
                            <StatsSection title="Trading Activity">
                                <StatItem 
                                    label="Trade Count"
                                    value={result.body.tradeCount}
                                    formatter={(value) => value.toLocaleString()}
                                    tooltip="Number of trades in the last 24 hours"
                                />
                                <StatItem 
                                    label="Avg Trade Size"
                                    value={result.body.averageTradeSize}
                                    formatter={formatCurrency}
                                    tooltip="Average size of trades in the last 24 hours"
                                />
                            </StatsSection>
                            {result.body.topTraders && result.body.topTraders.length > 0 && (
                                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-2">
                                    <h3 className="font-medium mb-2 text-sm text-neutral-700 dark:text-neutral-300">Top Traders</h3>
                                    <div className="text-xs space-y-1">
                                        {result.body.topTraders.slice(0, 5).map((trader: Trader, index: number) => (
                                            <div key={index} className="flex justify-between">
                                                <span className="opacity-70 truncate">{trader.address.slice(0, 6)}...{trader.address.slice(-4)}</span>
                                                <span>{formatCurrency(trader.volume)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : "Failed to analyze trading activity"
            }}
            className="w-full"
        />
    )
}

interface StatsSectionProps {
    title: string;
    children: React.ReactNode;
}

const StatsSection: React.FC<StatsSectionProps> = ({ title, children }) => {
    return (
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-2">
            <h3 className="font-medium mb-2 text-sm text-neutral-700 dark:text-neutral-300">{title}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                {children}
            </div>
        </div>
    );
};

interface StatItemProps {
    label: string;
    value: string | number;
    formatter?: (value: number) => string;
    suffix?: string;
    className?: string;
    tooltip?: string;
}

const StatItem: React.FC<StatItemProps> = ({ 
    label, 
    value, 
    formatter, 
    suffix = '', 
    className = '',
    tooltip
}) => {
    const formattedValue = typeof value === 'number' && formatter 
        ? formatter(value)
        : value;

    return (
        <div className={className} title={tooltip}>
            <p className="font-medium text-xs opacity-50">{label}</p>
            <p className="text-sm">{formattedValue}{suffix}</p>
        </div>
    );
};

const formatCurrency = (num: number): string => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
}

export default TradingActivity; 