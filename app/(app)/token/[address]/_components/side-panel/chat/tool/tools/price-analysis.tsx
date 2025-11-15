'use client';

import React from 'react';

import ToolCard from '../base';

import type { ToolInvocation } from 'ai';
import type { TokenPagePriceAnalysisResultType } from '@/ai';
import type { TokenChatData } from '@/types';

interface Props {
  tool: ToolInvocation;
  token: TokenChatData;
}

const PriceAnalysis: React.FC<Props> = ({ tool, token }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Analyzing Price Data..."
      result={{
        heading: (result: TokenPagePriceAnalysisResultType) =>
          result.body ? `Price Analysis` : `Failed to Analyze Price Data`,
        body: (result: TokenPagePriceAnalysisResultType) =>
          result.body ? (
            <div className="flex flex-col gap-2">
              <StatsSection title="Current Price">
                <StatItem
                  label="Price"
                  value={result.body.currentPrice}
                  formatter={formatCurrency}
                  className="col-span-2"
                />
              </StatsSection>
              <StatsSection title="Volatility">
                <StatItem
                  label="Daily"
                  value={result.body.volatility.daily}
                  formatter={(value) => value.toFixed(2)}
                  suffix="%"
                  tooltip="Daily price volatility"
                />
                <StatItem
                  label="Weekly"
                  value={result.body.volatility.weekly}
                  formatter={(value) => value.toFixed(2)}
                  suffix="%"
                  tooltip="Weekly price volatility"
                />
                <StatItem
                  label="Assessment"
                  value={result.body.volatility.description}
                  className="col-span-2 text-xs"
                />
              </StatsSection>
              <StatsSection title="Trend Analysis">
                <StatItem
                  label="Direction"
                  value={result.body.trendAnalysis.direction}
                  formatter={formatTrendDirection}
                  className={
                    result.body.trendAnalysis.direction === 'bullish'
                      ? 'text-green-500'
                      : result.body.trendAnalysis.direction === 'bearish'
                        ? 'text-red-500'
                        : ''
                  }
                />
                <StatItem
                  label="Strength"
                  value={result.body.trendAnalysis.strength}
                  suffix="/10"
                  tooltip="Trend strength indicator"
                />
                <StatItem
                  label="Assessment"
                  value={result.body.trendAnalysis.description}
                  className="col-span-2 text-xs"
                />
              </StatsSection>
              <StatsSection title="Trading Volume">
                <StatItem
                  label="24h Volume"
                  value={result.body.tradingVolume.current24h}
                  formatter={(value) =>
                    value.toLocaleString(undefined, {
                      notation: 'compact',
                      maximumFractionDigits: 0,
                    }) +
                    ' ' +
                    token.symbol
                  }
                />
                <StatItem
                  label="24h Change"
                  value={result.body.tradingVolume.change24h}
                  formatter={(value) => value.toFixed(2)}
                  suffix="%"
                  className={
                    result.body.tradingVolume.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                />
                <StatItem
                  label="Average Daily"
                  value={result.body.tradingVolume.averageDaily}
                  formatter={formatCurrency}
                  className="col-span-2"
                />
              </StatsSection>
              <StatsSection title="Market Metrics">
                <StatItem
                  label="Market Cap"
                  value={result.body.marketMetrics.marketCap}
                  formatter={formatCurrency}
                />
                <StatItem
                  label="FDV"
                  value={result.body.marketMetrics.fullyDilutedValue}
                  formatter={formatCurrency}
                  tooltip="Fully Diluted Value"
                />
                {result.body.marketMetrics.rank && (
                  <StatItem
                    label="Market Rank"
                    value={result.body.marketMetrics.rank}
                    formatter={(value) => `#${value}`}
                    className="col-span-2"
                  />
                )}
              </StatsSection>
              {result.body.technicalLevels && (
                <StatsSection title="Technical Levels">
                  <StatItem
                    label="Support"
                    value={result.body.technicalLevels.support[0]}
                    formatter={formatCurrency}
                    tooltip="Nearest support level"
                  />
                  <StatItem
                    label="Resistance"
                    value={result.body.technicalLevels.resistance[1]}
                    formatter={formatCurrency}
                    tooltip="Nearest resistance level"
                  />
                </StatsSection>
              )}
            </div>
          ) : (
            'Failed to analyze price data'
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
  formatter?: (value: any) => string;
  suffix?: string;
  tooltip?: string;
  className?: string;
  colSpan?: number;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  formatter,
  suffix = '',
  tooltip,
  className = '',
  colSpan,
}) => {
  const formattedValue = formatter ? formatter(value) : value;

  return (
    <div className={`${className} ${colSpan ? `col-span-${colSpan}` : ''}`}>
      <p className="font-medium text-xs opacity-50">{label}</p>
      <p className="text-sm" title={tooltip}>
        {formattedValue}
        {suffix}
      </p>
    </div>
  );
};

const formatCurrency = (num: number): string => {
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 5,
  });
};

const formatTrendDirection = (direction: string): string => {
  return direction.charAt(0).toUpperCase() + direction.slice(1);
};

export default PriceAnalysis;
