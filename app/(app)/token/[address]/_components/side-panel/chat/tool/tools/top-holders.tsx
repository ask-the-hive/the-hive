import React from 'react'

import ToolCard from '../base';

import type { ToolInvocation } from 'ai';
import type { TokenPageTopHoldersResultType } from '@/ai';

interface Props {
    tool: ToolInvocation,
}

const TopHolders: React.FC<Props> = ({ tool }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Analyzing Top Holders...`}
            result={{
                heading: (result: TokenPageTopHoldersResultType) => result.body 
                    ? `Analyzed Top Holders` 
                    : `Failed to Analyze Top Holders`,
                body: (result: TokenPageTopHoldersResultType) => result.body 
                    ? (
                        <div className="flex flex-col gap-2">
                            <StatsSection title="Concentration Metrics">
                                <StatItem 
                                    label="Largest Holder"
                                    value={result.body.largestHolder}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="Top 5 Holders"
                                    value={result.body.top5HoldersPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="Top 10 Holders"
                                    value={result.body.top10HoldersPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="Top 20 Holders"
                                    value={result.body.top20HoldersPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                            </StatsSection>
                            <StatsSection title="Exchange & Vesting">
                                <StatItem 
                                    label="Exchange Holdings"
                                    value={result.body.exchangeHoldersPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="Vested Tokens"
                                    value={result.body.vestedHoldersPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="# of Exchanges"
                                    value={result.body.numExchanges}
                                />
                                <StatItem 
                                    label="# of Vesting Contracts"
                                    value={result.body.numVestingContracts}
                                />
                            </StatsSection>
                            <StatsSection title="Distribution Analysis">
                                <StatItem 
                                    label="Concentration"
                                    value={result.body.concentrationLevel}
                                />
                                <StatItem 
                                    label="Exchange Presence"
                                    value={result.body.exchangePresence}
                                />
                                <StatItem 
                                    label="Avg Top 10 Holding"
                                    value={result.body.avgTop10Holding}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                                <StatItem 
                                    label="Remaining Supply"
                                    value={result.body.remainingSupplyPercent}
                                    formatter={(value) => value.toFixed(2)}
                                    suffix="%"
                                />
                            </StatsSection>
                        </div>
                    ) : "No balance found"
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
}

const StatItem: React.FC<StatItemProps> = ({ label, value, formatter, suffix = '' }) => {
    const formattedValue = typeof value === 'number' && formatter 
        ? formatter(value)
        : value;

    return (
        <div>
            <p className="font-medium text-xs opacity-50">{label}</p>
            <p className="text-sm">{formattedValue}{suffix}</p>
        </div>
    );
};

export default TopHolders;