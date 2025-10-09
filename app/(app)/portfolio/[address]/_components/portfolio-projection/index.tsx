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

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold">Portfolio Projection</h2>
        </div>
      </div>
      <Card>{children}</Card>
    </div>
  );
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);

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

      console.log('Raw liquid staking positions:', liquidStakingPositions);

      if (!projectionResponse.ok) {
        throw new Error(`HTTP error! status: ${projectionResponse.status}`);
      }

      const projectionData = await projectionResponse.json();
      const currentPortfolio = currentPortfolioResponse.ok
        ? await currentPortfolioResponse.json()
        : null;

      console.log('Current portfolio:', currentPortfolio);

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

          console.log(
            `Enhanced position: ${position.lstToken.symbol}, Token Amount: ${position.amount}, Price: $${currentPriceUsd}, USD Value: $${currentUsdValue}`,
          );

          return {
            ...position,
            currentUsdValue,
            currentPriceUsd,
          };
        }) || [];

      // Calculate net APY from liquid staking positions
      const netStakingAPY = calculateNetStakingAPY(enhancedLiquidStakingPositions || []);
      console.log('projectionData', projectionData);
      console.log('netStakingAPY', netStakingAPY);
      console.log('enhancedLiquidStakingPositions', enhancedLiquidStakingPositions);

      // Add staking APY and positions data to the data
      const enhancedData = {
        ...projectionData,
        netStakingAPY,
        liquidStakingPositions: enhancedLiquidStakingPositions,
      };

      setData(enhancedData);
    } catch (err) {
      console.error('Error fetching portfolio projection:', err);
      setError('Failed to fetch projection data');
    } finally {
      setLoading(false);
    }
  }, [address, days, currentChain]);

  useEffect(() => {
    if (address) {
      fetchProjectionData();
    }
  }, [address, fetchProjectionData]);

  // Combine historical and projection data for the chart with APY overlay
  const chartData = React.useMemo(() => {
    if (!data) return [];

    // Calculate historical APY for portfolio growth projection
    const calculateHistoricalAPY = () => {
      if (data.historical.length < 2) return 0;

      const firstValue = data.historical[0].netWorth;
      const lastValue = data.historical[data.historical.length - 1].netWorth;
      const days = data.historical.length;

      if (firstValue === 0) return 0;

      const totalReturn = (lastValue - firstValue) / firstValue;
      const dailyReturn = Math.pow(1 + totalReturn, 1 / days) - 1;
      const annualizedReturn = Math.pow(1 + dailyReturn, 365) - 1;

      return annualizedReturn * 100; // Convert to percentage
    };

    const historicalAPY = calculateHistoricalAPY();

    const startDate = data.historical[0]?.date ? new Date(data.historical[0].date) : new Date();

    const combined = [
      // Historical data (actual past performance)
      ...data.historical.map((item) => ({
        ...item,
        type: 'Historical',
        date: new Date(item.date).toLocaleDateString(),
        netWorth: item.netWorth,
        // No netWorthWithStaking for historical data - it's the same
      })),
      // Projection data: two scenarios for future growth
      ...data.projection.map((item) => {
        const currentDate = new Date(item.date);
        const daysFromStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        // Scenario 1: Portfolio growth based on historical APY only
        const portfolioGrowthValue =
          data.baseNetWorth * Math.pow(1 + historicalAPY / 100, daysFromStart / 365);

        // Scenario 2: Calculate compounding staking gains over time
        let totalStakingValue = 0;

        if (data.liquidStakingPositions && data.liquidStakingPositions.length > 0) {
          console.log('Processing liquid staking positions:', data.liquidStakingPositions.length);
          // Calculate the total value of all staking positions with compound growth
          totalStakingValue = data.liquidStakingPositions.reduce((totalValue, position) => {
            // Use the current USD value of the position
            const initialPositionValue = position.currentUsdValue || 0;

            // Calculate compound growth from staking start date to this projection date
            const positionAPY = position.poolData.yield || 0;
            const compoundedValue =
              initialPositionValue * Math.pow(1 + positionAPY / 100, daysFromStart / 365);

            console.log(
              `Position: ${position.lstToken.symbol}, USD Value: $${initialPositionValue}, APY: ${positionAPY}%, Days: ${daysFromStart}, Compounded: $${compoundedValue}`,
            );

            return totalValue + compoundedValue;
          }, 0);
        }

        // Calculate the original staking position values (without growth)
        const originalStakingValue =
          data.liquidStakingPositions?.reduce((total, position) => {
            return total + (position.currentUsdValue || 0);
          }, 0) || 0;

        // The staking gains are the difference between compounded value and original value
        const totalStakingGains = totalStakingValue - originalStakingValue;

        const portfolioWithStakingValue = portfolioGrowthValue + totalStakingGains;
        console.log('originalStakingValue', originalStakingValue);
        console.log('totalStakingGains', totalStakingGains);
        console.log('portfolioGrowthValue', portfolioGrowthValue);
        console.log('portfolioWithStakingValue', portfolioWithStakingValue);
        console.log('--------------------------------');
        return {
          ...item,
          type: 'Projection',
          date: new Date(item.date).toLocaleDateString(),
          netWorth: portfolioGrowthValue, // Future growth with historical APY
          netWorthWithStaking: portfolioWithStakingValue, // Portfolio growth + isolated staking gains
        };
      }),
    ];

    return combined;
  }, [data]);

  console.log('chartData', chartData);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'netWorth'
                ? 'Net Worth'
                : entry.dataKey === 'apyValue'
                  ? 'APY Overlay'
                  : entry.dataKey}
              : {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <Wrapper>
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

  const currentValue = data.baseNetWorth;
  const projectedValue = data.projection[data.projection.length - 1]?.netWorth || currentValue;
  const totalGain = projectedValue - currentValue;
  const percentageGain = (totalGain / currentValue) * 100;

  return (
    <Wrapper>
      <CardHeader>
        <div className="flex items-center justify-between">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">{formatCurrency(currentValue)}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Current Value</span>
              </div>
            </div>
            <div className="text-center bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">{formatCurrency(projectedValue)}</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Projected Value</span>
              </div>
            </div>
            <div className="text-center bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <p
                  className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}
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
                <span className="text-sm text-muted-foreground">Projected Gain</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
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
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="Portfolio Growth (Historical APY)"
                />
                <Line
                  type="monotone"
                  dataKey="netWorthWithStaking"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Portfolio + Staking (+${data?.netStakingAPY?.toFixed(2) || 0}% APY)`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Historical & Projected</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-red-500 rounded-full"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #ff6b6b 0px, #ff6b6b 3px, transparent 3px, transparent 6px)',
                }}
              ></div>
              <span>APY Overlay</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Wrapper>
  );
};

export default PortfolioProjection;
