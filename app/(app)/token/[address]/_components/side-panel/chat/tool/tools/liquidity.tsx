'use client';

import React from 'react';

import ToolCard from '../base';

import type { ToolInvocation } from 'ai';
import type { TokenPageLiquidityResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
}

const LiquidityAnalysis: React.FC<Props> = ({ tool }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Analyzing Liquidity..."
      result={{
        heading: (result: TokenPageLiquidityResultType) =>
          result.body ? `Liquidity Analysis` : `Failed to Analyze Liquidity`,
        body: (result: TokenPageLiquidityResultType) =>
          result.body ? (
            <div className="flex flex-col gap-2">
              <StatsSection title="Overall Liquidity">
                <StatItem
                  label="Total Liquidity"
                  value={result.body.totalLiquidityUSD}
                  formatter={formatCurrency}
                />
                <StatItem
                  label="Main Pool"
                  value={result.body.mainPool.liquidity}
                  formatter={formatCurrency}
                  tooltip={`Largest liquidity pool on ${result.body.mainPool.source}`}
                />
              </StatsSection>
              <StatsSection title="Volume Metrics">
                <StatItem
                  label="24h Volume"
                  value={result.body.volumeMetrics.volume24h}
                  formatter={formatCurrency}
                />
                <StatItem
                  label="24h Change"
                  value={result.body.volumeMetrics.volumeChange24h}
                  formatter={(value) => value.toFixed(2)}
                  suffix="%"
                  className={
                    result.body.volumeMetrics.volumeChange24h >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                  tooltip="Percentage change in trading volume over the last 24 hours"
                />
              </StatsSection>
              <StatsSection title="Liquidity Concentration">
                <StatItem
                  label="Top Pool Share"
                  value={result.body.liquidityConcentration.topPoolShare}
                  formatter={(value) => value.toFixed(1)}
                  suffix="%"
                  tooltip="Percentage of total liquidity in the largest pool"
                />
                <StatItem
                  label="Top 3 Pools Share"
                  value={result.body.liquidityConcentration.top3PoolsShare}
                  formatter={(value) => value.toFixed(1)}
                  suffix="%"
                  tooltip="Percentage of total liquidity in the three largest pools"
                />
              </StatsSection>
              <StatsSection title="Health Assessment">
                <StatItem
                  label="Health Score"
                  value={result.body.liquidityHealth.score}
                  suffix="/100"
                  className="font-bold"
                  tooltip="Score out of 100 based on liquidity depth, volume, and concentration"
                />
                <StatItem
                  label="Assessment"
                  value={result.body.liquidityHealth.description}
                  className="col-span-2"
                />
              </StatsSection>
            </div>
          ) : (
            'Failed to analyze liquidity'
          ),
      }}
      className="w-full"
    />
  );
};

interface StatsSectionProps {
  title: string;
  children: React.ReactNode;
}

const StatsSection: React.FC<StatsSectionProps> = ({ title, children }) => {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-4">
      <h3 className="font-medium mb-2 text-sm text-neutral-700 dark:text-neutral-300">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">{children}</div>
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
}) => {
  const formattedValue = typeof value === 'number' && formatter ? formatter(value) : value;

  return (
    <div className={className}>
      <p className="font-medium text-xs opacity-50">{label}</p>
      <p className="text-sm">
        {formattedValue}
        {suffix}
      </p>
    </div>
  );
};

const formatCurrency = (num: number): string => {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

export default LiquidityAnalysis;
