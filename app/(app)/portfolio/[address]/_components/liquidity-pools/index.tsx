import React, { useState, useEffect } from 'react';
import { Droplet, Info } from 'lucide-react';
import Image from 'next/image';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@/components/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useChain } from '@/app/_contexts/chain-context';
import { usePortfolio } from '@/hooks';
import { getAllLiquidStakingPositions } from '@/services/liquid-staking/get-all';
import { getLiquidStakingPool } from '@/services/liquid-staking/get-pool';
import { LiquidStakingPosition } from '@/db/types';
import { formatFiat, formatCrypto, formatCompactNumber } from '@/lib/format';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';

interface Props {
  address: string;
}

interface PoolTooltipProps {
  poolData: any;
  loading: boolean;
}

const PoolTooltip: React.FC<PoolTooltipProps> = ({ poolData, loading }) => {
  return (
    <TooltipContent className="max-w-xs">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="font-medium">Protocol:</div>
        <div>{poolData.project || 'Unknown'}</div>

        <div className="font-medium">APY:</div>
        <div className="text-green-600">
          {loading ? <Skeleton className="w-12 h-3" /> : `${poolData.yield?.toFixed(2) || '0.00'}%`}
        </div>
        <div className="font-medium">TVL:</div>
        <div>
          {loading ? <Skeleton className="w-16 h-3" /> : formatCompactNumber(poolData.tvlUsd || 0)}
        </div>

        {poolData.predictions && (
          <>
            <div className="font-medium">APY Confidence:</div>
            <div className="text-green-600">
              {loading ? (
                <Skeleton className="w-12 h-3" />
              ) : (
                getConfidenceLabel(poolData.predictions.binnedConfidence)
              )}
            </div>

            <div className="font-medium">Prediction:</div>
            <div>
              {loading ? (
                <Skeleton className="w-20 h-3" />
              ) : (
                `${poolData.predictions.predictedClass} (${poolData.predictions.predictedProbability}%)`
              )}
            </div>
          </>
        )}

        {poolData.url && (
          <>
            <div className="font-medium">URL:</div>
            <div className="truncate">
              <a
                href={poolData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {poolData.url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </>
        )}
      </div>
    </TooltipContent>
  );
};

const LiquidityPools: React.FC<Props> = ({ address }) => {
  const { currentChain } = useChain();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<LiquidStakingPosition[]>([]);
  const [poolDataLoading, setPoolDataLoading] = useState(false);

  // Get portfolio data to fetch current token balances
  const chainAddress = currentChain === 'solana' ? address : undefined;
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(chainAddress, currentChain);

  // Fetch fresh pool data for all positions and update positions state
  const fetchFreshPoolData = async (positions: LiquidStakingPosition[]) => {
    setPoolDataLoading(true);

    const promises = positions.map(async (position) => {
      try {
        const freshData = await getLiquidStakingPool(
          position.poolData.project,
          position.lstToken.symbol,
        );
        console.log('freshData', freshData);
        // Return position with updated pool data (merge with existing to preserve missing fields)
        return {
          ...position,
          poolData: {
            ...position.poolData,
            ...freshData,
          },
        };
      } catch (err) {
        console.error(
          `Failed to fetch fresh pool data for ${position.poolData.project}-${position.lstToken.symbol}:`,
          err,
        );
        // Return original position if fetch fails
        return position;
      }
    });

    const results = await Promise.allSettled(promises);
    const updatedPositions = results.map((result, index) =>
      result.status === 'fulfilled' ? result.value : positions[index],
    );

    setPositions(updatedPositions);
    setPoolDataLoading(false);
  };

  useEffect(() => {
    if (currentChain !== 'solana') return;
    let canceled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllLiquidStakingPositions(address);
        if (!canceled) {
          setPositions(data || []);
          // Fetch fresh pool data for all positions
          if (data && data.length > 0) {
            fetchFreshPoolData(data);
          }
        }
      } catch (e) {
        if (!canceled) setError(e instanceof Error ? e.message : 'Failed to load positions');
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [address, currentChain]);

  if (currentChain !== 'solana') return null;

  if (loading || portfolioLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!positions.length) {
    return null; // Don't show anything if no positions
  }

  // Calculate total value of liquid staking positions
  const totalValue = positions.reduce((sum, pos) => {
    const portfolioToken = portfolio?.items?.find(
      (item) => item.address === pos.lstToken.id || item.symbol === pos.lstToken.symbol,
    );
    if (portfolioToken && portfolioToken.valueUsd) {
      return sum + portfolioToken.valueUsd;
    }
    return sum;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-6 h-6" />
          <h2 className="text-xl font-bold">Liquid Staking Positions</h2>
        </div>
        {totalValue > 0 && (
          <p>
            $
            {totalValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
          </p>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Yield Earned</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Protocol TVL</TableHead>
              <TableHead>Yield Chart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="max-h-96 overflow-y-auto">
            {positions.map((position) => {
              // Find current balance from portfolio
              const portfolioToken = portfolio?.items?.find(
                (item) =>
                  item.address === position.lstToken.id || item.symbol === position.lstToken.symbol,
              );

              const rawBalance = portfolioToken?.balance || '0';
              const price = portfolioToken?.priceUsd || 0;
              const decimals = portfolioToken?.decimals || position.lstToken.decimals || 9;

              // Calculate yield earned (current balance - initial staked amount)
              const currentBalance = parseFloat(rawBalance.toString()) / Math.pow(10, decimals);
              const initialAmount = position.amount;
              const yieldEarned = currentBalance - initialAmount;

              // Convert yield earned back to raw balance format for utilities
              const yieldEarnedRaw = yieldEarned * Math.pow(10, decimals);

              // Generate chart data from position creation to now
              const generateChartData = () => {
                const startDate = new Date(position.createdAt);
                const endDate = new Date();
                const daysDiff = Math.ceil(
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                );

                // Generate data points (max 12 points for clean chart)
                const dataPoints = Math.min(12, Math.max(2, daysDiff));
                const data = [];

                for (let i = 0; i <= dataPoints; i++) {
                  const date = new Date(
                    startDate.getTime() +
                      (i / dataPoints) * (endDate.getTime() - startDate.getTime()),
                  );

                  // Simulate yield growth over time (compound growth)
                  const dailyRate = position.poolData.yield / 100 / 365;
                  const daysElapsed =
                    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                  const projectedBalance = initialAmount * Math.pow(1 + dailyRate, daysElapsed);
                  const projectedYield = (projectedBalance - initialAmount) * price;

                  data.push({
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    yield: Math.max(0, projectedYield),
                    balance: projectedBalance,
                  });
                }

                // Set the last point to actual current yield
                if (data.length > 0) {
                  const actualYieldFiat = yieldEarned * price;
                  data[data.length - 1].yield = Math.max(0, actualYieldFiat);
                  data[data.length - 1].balance = currentBalance;
                }

                return data;
              };

              const chartData = generateChartData();

              const chartConfig = {
                yield: {
                  label: 'Yield',
                  color: 'hsl(var(--chart-1))',
                },
              };

              return (
                <TableRow key={position.id}>
                  <TableCell>
                    <div className="font-medium flex gap-2 items-center">
                      {position.lstToken.logoURI ? (
                        <Image
                          src={position.lstToken.logoURI}
                          alt={position.lstToken.name}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                      )}
                      <p>{position.lstToken.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {`${formatCrypto(rawBalance, position.lstToken.symbol, decimals)} / ${formatFiat(rawBalance, price, decimals)}`}
                  </TableCell>
                  <TableCell>
                    <p
                      className={
                        yieldEarned > 0
                          ? 'text-green-600 font-medium'
                          : yieldEarned < 0
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900 font-medium'
                      }
                    >
                      {yieldEarned > 0 ? '+' : ''}
                      {formatCrypto(yieldEarnedRaw.toString(), position.lstToken.symbol, decimals)}
                      {' / '}
                      {yieldEarned > 0 ? '+' : ''}
                      {formatFiat(yieldEarnedRaw.toString(), price, decimals)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {poolDataLoading ? (
                        <Skeleton className="w-12 h-4" />
                      ) : (
                        `${position.poolData.yield.toFixed(2)}%`
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {capitalizeWords(position.poolData.project || 'Unknown')}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <PoolTooltip poolData={position.poolData} loading={poolDataLoading} />
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {poolDataLoading ? (
                        <Skeleton className="w-16 h-4" />
                      ) : (
                        formatCompactNumber(position.poolData.tvlUsd || 0)
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {chartData.length > 1 && chartData.some((point) => point.yield > 0) ? (
                      <div className="w-[200px] h-[100px]">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                            >
                              <XAxis
                                dataKey="date"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                hide
                              />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} hide />
                              <ChartTooltip
                                cursor={{ stroke: 'var(--color-yield)', strokeWidth: 1 }}
                                content={({ active, payload, label }) =>
                                  active && payload?.[0] ? (
                                    <ChartTooltipContent
                                      payload={payload}
                                      label={label}
                                      formatter={(value) => [
                                        `$${Number(value).toFixed(2)}`,
                                        'Yield Earned',
                                      ]}
                                    />
                                  ) : null
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="yield"
                                name="yield"
                                strokeWidth={1.5}
                                dot={false}
                                fill="var(--color-yield)"
                                fillOpacity={0.2}
                                stroke="var(--color-yield)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    ) : (
                      <p>--</p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LiquidityPools;
