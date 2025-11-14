'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChain } from '@/app/_contexts/chain-context';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiquidStakingPosition } from '@/db/types';
import type { LendingPosition } from '@/types/lending-position';

interface ProjectionData {
  baseNetWorth: number;
  historical: Array<{
    date: string;
    netWorth: number;
  }>;
  projection: Array<{
    date: string;
    netWorth: number;
    netWorthWithStaking?: number;
  }>;
  netStakingAPY?: number;
  netLendingAPY?: number;
  liquidStakingPositions?: (LiquidStakingPosition & {
    currentUsdValue?: number;
    currentPriceUsd?: number;
  })[];
  lendingPositions?: LendingPosition[];
}

interface Props {
  address: string;
  stakingPositions: LiquidStakingPosition[] | null;
  lendingPositions: LendingPosition[] | null;
}

const Wrapper: React.FC<{
  children: React.ReactNode;
  hasStakingPositions: boolean;
  hasLendingPositions: boolean;
  loading: boolean;
  netWorth?: number;
}> = ({ children, hasStakingPositions, hasLendingPositions, loading, netWorth }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {loading && <Skeleton className="w-32 h-6" />}
            {!loading && (
              <h2 className="text-xl font-bold">
                {hasStakingPositions || hasLendingPositions
                  ? 'Portfolio Projection'
                  : 'Portfolio History'}
              </h2>
            )}
          </div>
          {!hasStakingPositions && !hasLendingPositions && netWorth && (
            <div className="text-center bg-muted/50 rounded-lg">
              <p className=" text-base md:text-xl font-bold">{formatCurrency(netWorth)}</p>
              <span className="text-xs md:text-sm text-muted-foreground">Net Worth</span>
            </div>
          )}
        </div>
      </div>
      <Card>{children}</Card>
    </div>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper function to calculate net APY from liquid staking positions
const calculateNetStakingAPY = (positions: LiquidStakingPosition[]): number => {
  if (!positions.length) return 0;

  // Calculate weighted APY based on position values
  let totalValue = 0;
  let weightedAPY = 0;

  positions.forEach((position) => {
    const positionValue = position.amount; // Use amount as proxy for value
    totalValue += positionValue;
    weightedAPY += (position.poolData.yield || 0) * positionValue;
  });

  return totalValue > 0 ? weightedAPY / totalValue : 0;
};

// Helper function to calculate net APY from lending positions
const calculateNetLendingAPY = (positions: LendingPosition[]): number => {
  if (!positions.length) return 0;

  // Calculate weighted APY based on position values
  let totalValue = 0;
  let weightedAPY = 0;

  positions.forEach((position) => {
    const positionValue = position.amount; // Amount in human-readable format
    totalValue += positionValue;
    weightedAPY += (position.poolData.yield || 0) * positionValue;
  });

  return totalValue > 0 ? weightedAPY / totalValue : 0;
};

const PortfolioProjection: React.FC<Props> = ({ address, stakingPositions, lendingPositions }) => {
  const { currentChain } = useChain();
  const [data, setData] = useState<ProjectionData | null>(null);
  const [, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);
  const [hasStakingPositions, setHasStakingPositions] = useState(false);
  const [hasLendingPositions, setHasLendingPositions] = useState(false);

  const fetchProjectionData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio projection
      const projectionResponse = await fetch(
        `/api/portfolio/projection?wallet=${address}&days=${days}&chain=${currentChain}`,
      );

      if (!projectionResponse.ok) {
        throw new Error(`HTTP error! status: ${projectionResponse.status}`);
      }

      const projectionData = await projectionResponse.json();

      // Calculate net APY from liquid staking positions
      const netStakingAPY = calculateNetStakingAPY(stakingPositions || []);

      // Calculate net APY from lending positions
      const netLendingAPY = calculateNetLendingAPY(lendingPositions || []);

      // Add staking/lending APY and positions data to the data
      const enhancedData = {
        ...projectionData,
        netStakingAPY,
        netLendingAPY,
        liquidStakingPositions: stakingPositions || [],
        lendingPositions: lendingPositions || [],
      };

      setHasStakingPositions((stakingPositions || []).length > 0);
      setHasLendingPositions((lendingPositions || []).length > 0);
      setData(enhancedData);
    } catch (err) {
      console.error('Error fetching portfolio projection:', err);
      setError('Failed to fetch projection data');
    } finally {
      setLoading(false);
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  }, [address, days, currentChain, initialLoading, stakingPositions, lendingPositions]);

  useEffect(() => {
    if (address) {
      fetchProjectionData();
    }
  }, [address, fetchProjectionData]);

  // Handle days change with loading state
  const handleDaysChange = React.useCallback((value: string) => {
    setProjectionLoading(true);
    setDays(parseInt(value));
    // Brief delay to show loading state
    setTimeout(() => setProjectionLoading(false), 50);
  }, []);

  // Memoize historical data separately to prevent unnecessary recalculations
  const historicalData = React.useMemo(() => {
    if (!data) return [];
    return data.historical.map((item) => ({
      ...item,
      type: 'Historical',
      date: new Date(item.date).toLocaleDateString(),
      netWorth: item.netWorth,
      projectedNetWorth: null, // No projection for historical data
    }));
  }, [data]);

  // Combine historical and projection data for the chart
  const chartData = React.useMemo(() => {
    if (!data) return [];

    // Get the most recent historical date to determine where projections start
    const lastHistoricalDate =
      data.historical.length > 0
        ? new Date(data.historical[data.historical.length - 1].date)
        : new Date();

    // Calculate current net worth (most recent historical value or base net worth)
    const currentNetWorth =
      data.historical.length > 0
        ? data.historical[data.historical.length - 1].netWorth
        : data.baseNetWorth;

    // Calculate net APY from liquid staking positions
    const netStakingAPY = data.netStakingAPY || 0;
    // Calculate net APY from lending positions
    const netLendingAPY = data.netLendingAPY || 0;

    // Calculate total value of staking positions
    const totalStakingValue =
      data.liquidStakingPositions?.reduce((total, position) => {
        return total + (position.currentUsdValue || 0);
      }, 0) || 0;

    // Calculate total value of lending positions (using amount as USD value proxy)
    // Note: This assumes position.amount is already in USD or we need to multiply by token price
    // For now, we'll use amount directly as it should represent the USD value
    const totalLendingValue =
      data.lendingPositions?.reduce((total, position) => {
        // Get token price from portfolio if available, otherwise use amount as-is
        // For simplicity, we'll use amount directly assuming it's already in USD terms
        return total + position.amount;
      }, 0) || 0;

    // Calculate combined yield positions value
    const totalYieldPositionsValue = totalStakingValue + totalLendingValue;

    // Calculate weighted combined APY
    let combinedAPY = 0;
    if (totalYieldPositionsValue > 0) {
      const stakingWeight = totalStakingValue / totalYieldPositionsValue;
      const lendingWeight = totalLendingValue / totalYieldPositionsValue;
      combinedAPY = netStakingAPY * stakingWeight + netLendingAPY * lendingWeight;
    }

    // Generate forward projections if we have yield positions (staking or lending)
    const projectionData = [];
    const hasYieldPositions = hasStakingPositions || hasLendingPositions;
    if (hasYieldPositions && combinedAPY > 0 && totalYieldPositionsValue > 0) {
      // Calculate non-yield portfolio value (base portfolio minus yield positions)
      const nonYieldValue = currentNetWorth - totalYieldPositionsValue;

      // Add a projection point at day 0 (same day as last historical data) to connect the lines
      projectionData.push({
        date: lastHistoricalDate.toLocaleDateString(),
        netWorth: currentNetWorth, // Start projection at current net worth
        type: 'Projection',
      });

      // Start with day 7, then generate one data point per week
      for (let i = 7; i <= days; i += 7) {
        const projectionDate = new Date(lastHistoricalDate);
        projectionDate.setDate(projectionDate.getDate() + i);

        // Calculate yield gains with compound interest (combined from staking + lending)
        const daysFromNow = i;
        const yieldGains =
          totalYieldPositionsValue * (Math.pow(1 + combinedAPY / 100, daysFromNow / 365) - 1);

        // Total projected value = non-yield value + original yield positions value + yield gains
        const projectedValue = nonYieldValue + totalYieldPositionsValue + yieldGains;

        projectionData.push({
          date: projectionDate.toLocaleDateString(),
          netWorth: projectedValue,
          type: 'Projection',
        });
      }

      // Add final data point at the exact end date if it wasn't included
      const lastDataPoint = projectionData[projectionData.length - 1];
      if (lastDataPoint && days > 1 && days % 7 !== 1) {
        const projectionDate = new Date(lastHistoricalDate);
        projectionDate.setDate(projectionDate.getDate() + days);

        const yieldGains =
          totalYieldPositionsValue * (Math.pow(1 + combinedAPY / 100, days / 365) - 1);
        const projectedValue = nonYieldValue + totalYieldPositionsValue + yieldGains;

        projectionData.push({
          date: projectionDate.toLocaleDateString(),
          netWorth: projectedValue,
          type: 'Projection',
        });
      }
    }

    const combined = [
      // Historical data (actual past performance)
      ...historicalData,
      // Projection data (only if we have staking positions)
      ...projectionData.map((item) => ({
        ...item,
        netWorth: null, // No historical value for projection data
        projectedNetWorth: item.netWorth,
      })),
    ];

    return combined;
  }, [data, days, hasStakingPositions, hasLendingPositions, historicalData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;

            const isProjection = entry.dataKey === 'projectedNetWorth';
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {isProjection ? 'Projected Value' : 'Historical Value'}:{' '}
                {formatCurrency(entry.value)}
              </p>
            );
          })}
          {payload.some(
            (entry: any) => entry.dataKey === 'projectedNetWorth' && entry.value !== null,
          ) &&
            (hasStakingPositions || hasLendingPositions) && (
              <p className="text-xs text-muted-foreground mt-1">
                {hasStakingPositions && hasLendingPositions
                  ? `Based on ${data?.netStakingAPY?.toFixed(2) || 0}% staking APY and ${data?.netLendingAPY?.toFixed(2) || 0}% lending APY`
                  : hasStakingPositions
                    ? `Based on ${data?.netStakingAPY?.toFixed(2) || 0}% staking APY`
                    : `Based on ${data?.netLendingAPY?.toFixed(2) || 0}% lending APY`}
              </p>
            )}
        </div>
      );
    }
    return null;
  };

  if (initialLoading || stakingPositions === null || lendingPositions === null) {
    return (
      <Wrapper
        loading={initialLoading || stakingPositions === null || lendingPositions === null}
        hasStakingPositions={false}
        hasLendingPositions={false}
      >
        <Skeleton className="h-64 w-full" />
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper
        hasStakingPositions={hasStakingPositions}
        hasLendingPositions={hasLendingPositions}
        loading={initialLoading}
      >
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchProjectionData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Wrapper>
    );
  }

  if (!data || data.baseNetWorth === 0) {
    return null;
  }

  // Calculate total value of staking positions
  const totalStakingValue =
    data.liquidStakingPositions?.reduce((total, position) => {
      return total + (position.currentUsdValue || 0);
    }, 0) || 0;

  // Calculate total value of lending positions (using amount as USD value proxy)
  // Note: This assumes position.amount is already in USD or we need to multiply by token price
  // For now, we'll use amount directly as it should represent the USD value
  const totalLendingValue =
    data.lendingPositions?.reduce((total, position) => {
      // Get token price from portfolio if available, otherwise use amount as-is
      // For simplicity, we'll use amount directly assuming it's already in USD terms
      return total + position.amount;
    }, 0) || 0;

  // Calculate current value including lending positions
  // The historical data may not include lending positions, so we add them here
  const baseCurrentValue =
    data.historical.length > 0
      ? data.historical[data.historical.length - 1].netWorth
      : data.baseNetWorth;

  // Add lending positions to current value if they're not already included in historical data
  // Note: We assume historical data doesn't include lending positions, so we add them
  const currentValue = baseCurrentValue + totalLendingValue;

  // Calculate projected value based on staking and lending APY
  const netStakingAPY = data.netStakingAPY || 0;
  const netLendingAPY = data.netLendingAPY || 0;
  let projectedValue = currentValue;

  // Calculate combined yield positions value
  const totalYieldPositionsValue = totalStakingValue + totalLendingValue;

  // Calculate weighted combined APY
  let combinedAPY = 0;
  if (totalYieldPositionsValue > 0) {
    const stakingWeight = totalStakingValue / totalYieldPositionsValue;
    const lendingWeight = totalLendingValue / totalYieldPositionsValue;
    combinedAPY = netStakingAPY * stakingWeight + netLendingAPY * lendingWeight;
  }

  // If we have yield positions (staking or lending), calculate projected value
  const hasYieldPositions = hasStakingPositions || hasLendingPositions;
  if (hasYieldPositions && combinedAPY > 0 && totalYieldPositionsValue > 0) {
    // Calculate non-yield portfolio value (base portfolio minus yield positions)
    const nonYieldValue = currentValue - totalYieldPositionsValue;

    // Calculate yield gains with compound interest (combined from staking + lending)
    const yieldGains = totalYieldPositionsValue * (Math.pow(1 + combinedAPY / 100, days / 365) - 1);

    // Total projected value = non-yield value + original yield positions value + yield gains
    projectedValue = nonYieldValue + totalYieldPositionsValue + yieldGains;
  }

  const totalGain = projectedValue - currentValue;
  const percentageGain = currentValue > 0 ? (totalGain / currentValue) * 100 : 0;

  return (
    <Wrapper
      hasStakingPositions={hasStakingPositions}
      hasLendingPositions={hasLendingPositions}
      loading={initialLoading}
      netWorth={currentValue}
    >
      {(hasStakingPositions || hasLendingPositions) && (
        <CardHeader>
          <div className="flex items-center flex-col md:flex-row justify-between">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-muted/50 rounded-lg">
                <p className=" text-base md:text-xl font-bold">{formatCurrency(currentValue)}</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">Current Value</span>
                </div>
              </div>
              <div className="text-center bg-muted/50 rounded-lg">
                <p className="text-base md:text-xl font-bold">{formatCurrency(projectedValue)}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">Projected Value</span>
                </div>
              </div>
              <div className="text-center bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-base md:text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {totalGain >= 0 ? '+' : ''}
                    {formatCurrency(totalGain)}
                  </p>
                  <p className={`text-sm ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({totalGain >= 0 ? '+' : ''}
                    {percentageGain.toFixed(2)}%)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">Projected Gain</span>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-col gap-2">
              <p className="text-sm text-muted-foreground">Projected:</p>
              <div className="">
                <Select value={days.toString()} onValueChange={handleDaysChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">2 months</SelectItem>
                    <SelectItem value="90">3 months</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className={`space-y-6 ${!hasStakingPositions ? 'pt-10' : ''}`}>
          {/* Chart */}
          {projectionLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#D19900"
                    strokeWidth={2}
                    dot={false}
                    name="Historical Portfolio Value"
                  />
                  {((data.liquidStakingPositions && data.liquidStakingPositions.length > 0) ||
                    (data.lendingPositions && data.lendingPositions.length > 0)) && (
                    <Line
                      type="monotone"
                      dataKey="projectedNetWorth"
                      stroke="#D19900"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name={
                        hasStakingPositions && hasLendingPositions
                          ? `Projected w/ Yield (${data?.netStakingAPY?.toFixed(2) || 0}% staking, ${data?.netLendingAPY?.toFixed(2) || 0}% lending)`
                          : hasStakingPositions
                            ? `Projected w/ Staking (${data?.netStakingAPY?.toFixed(2) || 0}% net APY)`
                            : `Projected w/ Lending (${data?.netLendingAPY?.toFixed(2) || 0}% net APY)`
                      }
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-600 rounded-full"></div>
              <span>Historical Portfolio Value</span>
            </div>
            {((data.liquidStakingPositions && data.liquidStakingPositions.length > 0) ||
              (data.lendingPositions && data.lendingPositions.length > 0)) &&
              ((data?.netStakingAPY || 0) > 0 || (data?.netLendingAPY || 0) > 0) && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 bg-brand-600 rounded-full"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, #d19900 0px, #d19900 3px, transparent 3px, transparent 6px)',
                    }}
                  ></div>
                  <span>
                    {hasStakingPositions && hasLendingPositions
                      ? `Projected w/ Yield (${data?.netStakingAPY?.toFixed(2) || 0}% staking, ${data?.netLendingAPY?.toFixed(2) || 0}% lending)`
                      : hasStakingPositions
                        ? `Projected w/ Staking (${data?.netStakingAPY?.toFixed(2) || 0}% net APY)`
                        : `Projected w/ Lending (${data?.netLendingAPY?.toFixed(2) || 0}% net APY)`}
                  </span>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Wrapper>
  );
};

export default PortfolioProjection;
