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
import { getAllLiquidStakingPositions } from '@/services/liquid-staking/get-all';
import type { LiquidStakingPosition } from '@/db/types';

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
  liquidStakingPositions?: (LiquidStakingPosition & {
    currentUsdValue?: number;
    currentPriceUsd?: number;
  })[];
}

interface Props {
  address: string;
}

const Wrapper: React.FC<{
  children: React.ReactNode;
  hasStakingPositions: boolean;
  loading: boolean;
  netWorth?: number;
}> = ({ children, hasStakingPositions, loading, netWorth }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {loading && <Skeleton className="w-32 h-6" />}
            {!loading && (
              <h2 className="text-xl font-bold">
                {hasStakingPositions ? 'Portfolio Projection' : 'Portfolio History'}
              </h2>
            )}
          </div>
          {!hasStakingPositions && netWorth && (
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

const PortfolioProjection: React.FC<Props> = ({ address }) => {
  const { currentChain } = useChain();
  const [data, setData] = useState<ProjectionData | null>(null);
  const [, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);
  const [hasStakingPositions, setHasStakingPositions] = useState(false);

  const fetchProjectionData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio projection, liquid staking positions, and current portfolio in parallel
      const [projectionResponse, liquidStakingPositions, currentPortfolioResponse] =
        await Promise.all([
          fetch(`/api/portfolio/projection?wallet=${address}&days=${days}&chain=${currentChain}`),
          getAllLiquidStakingPositions(address),
          fetch(`/api/portfolio/${address}?chain=${currentChain}`),
        ]);

      if (!projectionResponse.ok) {
        throw new Error(`HTTP error! status: ${projectionResponse.status}`);
      }

      const projectionData = await projectionResponse.json();
      const currentPortfolio = currentPortfolioResponse.ok
        ? await currentPortfolioResponse.json()
        : null;

      // Enhance liquid staking positions with current USD values
      const enhancedLiquidStakingPositions =
        liquidStakingPositions?.map((position) => {
          // Find the matching token in current portfolio to get current price
          const portfolioToken = currentPortfolio?.items?.find(
            (item: any) =>
              item.symbol === position.lstToken.symbol || item.address === position.lstToken.id,
          );

          const currentPriceUsd = portfolioToken?.priceUsd || 0;
          const currentUsdValue = position.amount * currentPriceUsd;

          return {
            ...position,
            currentUsdValue,
            currentPriceUsd,
          };
        }) || [];

      // Calculate net APY from liquid staking positions
      const netStakingAPY = calculateNetStakingAPY(enhancedLiquidStakingPositions || []);

      // Add staking APY and positions data to the data
      const enhancedData = {
        ...projectionData,
        netStakingAPY,
        liquidStakingPositions: enhancedLiquidStakingPositions,
      };

      setHasStakingPositions(enhancedLiquidStakingPositions.length > 0);
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
  }, [address, days, currentChain, initialLoading]);

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

    // Generate forward projections if we have staking positions
    const projectionData = [];
    if (hasStakingPositions && netStakingAPY > 0 && data.liquidStakingPositions) {
      // Calculate total current staking position value
      const totalStakingValue = data.liquidStakingPositions.reduce((total, position) => {
        return total + (position.currentUsdValue || 0);
      }, 0);

      // Calculate non-staking portfolio value (base portfolio minus staking positions)
      const nonStakingValue = currentNetWorth - totalStakingValue;

      for (let i = 1; i <= days; i++) {
        const projectionDate = new Date(lastHistoricalDate);
        projectionDate.setDate(projectionDate.getDate() + i);

        // Calculate staking gains with compound interest
        const daysFromNow = i;
        const stakingGains =
          totalStakingValue * (Math.pow(1 + netStakingAPY / 100, daysFromNow / 365) - 1);

        // Total projected value = non-staking value + original staking value + staking gains
        const projectedValue = nonStakingValue + totalStakingValue + stakingGains;

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
  }, [data, days, hasStakingPositions, historicalData]);

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
            hasStakingPositions && (
              <p className="text-xs text-muted-foreground mt-1">
                Based on {data?.netStakingAPY?.toFixed(2) || 0}% staking APY
              </p>
            )}
        </div>
      );
    }
    return null;
  };

  if (initialLoading) {
    return (
      <Wrapper hasStakingPositions={hasStakingPositions} loading={initialLoading}>
        <Skeleton className="h-64 w-full" />
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper hasStakingPositions={hasStakingPositions} loading={initialLoading}>
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

  const currentValue =
    data.historical.length > 0
      ? data.historical[data.historical.length - 1].netWorth
      : data.baseNetWorth;

  // Calculate projected value based on staking APY (only applied to staking positions)
  const netStakingAPY = data.netStakingAPY || 0;
  let projectedValue = currentValue;

  if (data.liquidStakingPositions && data.liquidStakingPositions.length > 0 && netStakingAPY > 0) {
    // Calculate total current staking position value
    const totalStakingValue = data.liquidStakingPositions.reduce((total, position) => {
      return total + (position.currentUsdValue || 0);
    }, 0);

    // Calculate non-staking portfolio value
    const nonStakingValue = currentValue - totalStakingValue;

    // Calculate staking gains with compound interest over the selected period
    const stakingGains = totalStakingValue * (Math.pow(1 + netStakingAPY / 100, days / 365) - 1);

    // Total projected value = non-staking value + original staking value + staking gains
    projectedValue = nonStakingValue + totalStakingValue + stakingGains;
  }

  const totalGain = projectedValue - currentValue;
  const percentageGain = currentValue > 0 ? (totalGain / currentValue) * 100 : 0;

  return (
    <Wrapper
      hasStakingPositions={hasStakingPositions}
      loading={initialLoading}
      netWorth={currentValue}
    >
      {hasStakingPositions && (
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Historical Portfolio Value"
                  />
                  {data.liquidStakingPositions && data.liquidStakingPositions.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey="projectedNetWorth"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name={`Projected w/ Staking (${data?.netStakingAPY?.toFixed(2) || 0}% net APY)`}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Historical Portfolio Value</span>
            </div>
            {data.liquidStakingPositions && data.liquidStakingPositions.length > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 bg-green-500 rounded-full"
                  style={{
                    background:
                      'repeating-linear-gradient(90deg, #22c55e 0px, #22c55e 3px, transparent 3px, transparent 6px)',
                  }}
                ></div>
                <span>Projected w/ Staking ({data?.netStakingAPY?.toFixed(2) || 0}% net APY)</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Wrapper>
  );
};

export default PortfolioProjection;
