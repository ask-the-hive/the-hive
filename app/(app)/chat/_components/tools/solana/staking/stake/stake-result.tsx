import React, { useMemo } from 'react';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Token } from '@/db/types';
import { LiquidStakingYieldsPoolData } from '@/ai';
import { usePrice } from '@/hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

// Generate quarters for 2 years: [3,6,9,12,15,18,21,24]
const MONTHS = Array.from({ length: 8 }, (_, i) => (i + 1) * 3);

interface Props {
  outputTokenData?: Token;
  poolData?: LiquidStakingYieldsPoolData;
  outputAmount?: number;
}

const StakeResult: React.FC<Props> = ({ outputTokenData, poolData, outputAmount }) => {
  const { data: outputTokenPrice } = usePrice(outputTokenData?.id || '');

  const amountUSD = useMemo(() => {
    if (!outputAmount || !outputTokenPrice) return null;
    return outputAmount * outputTokenPrice.value;
  }, [outputAmount, outputTokenPrice]);

  const chartData = useMemo(() => {
    if (!poolData?.yield || !outputAmount || !outputTokenPrice) return [];

    return MONTHS.map((month) => {
      const yearFraction = month / 12;
      const projectedYield =
        ((outputAmount * outputTokenPrice.value * poolData.yield) / 100) * yearFraction;
      return {
        month: `${month}M`,
        yield: Number(projectedYield.toFixed(4)),
      };
    });
  }, [poolData?.yield, outputAmount, outputTokenPrice]);

  const chartConfig = {
    yield: {
      label: 'Projected Yield',
      theme: {
        light: '#3b82f6',
        dark: '#60a5fa',
      },
    },
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <p className="text-md">Staked Successfully</p>
        {outputAmount && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Amount: {outputAmount} {outputTokenData?.symbol}{' '}
            {amountUSD && `($${amountUSD.toFixed(2)})`}
          </p>
        )}
        {outputTokenData && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Token: {outputTokenData.symbol}
          </p>
        )}
        {poolData && (
          <div className="mt-2 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
            <p className="font-medium mb-3">{poolData.name} Pool Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Name</p>
                <p className="font-medium">{poolData.name}</p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">APY</p>
                <p className="font-medium">{poolData.yield.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">TVL</p>
                <p className="font-medium">${(poolData.tvlUsd / 1_000_000).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-neutral-600 dark:text-neutral-400">Project</p>
                <p className="font-medium">{poolData.project.replace(/-/g, ' ')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-600 dark:text-neutral-400">Token address</p>
                <p className="font-medium">{poolData.underlyingTokens.join(', ') || 'None'}</p>
              </div>
              {poolData.predictions && (
                <>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-neutral-600 dark:text-neutral-400">Risk Level</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Classification of the pool&apos;s risk profile based on historical data
                            and market analysis
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="font-medium capitalize">{poolData.predictions.predictedClass}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-neutral-600 dark:text-neutral-400">Risk Confidence</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Confidence level of the risk assessment prediction (higher % = more
                            confident)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="font-medium">
                      {(poolData.predictions.predictedProbability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <p className="text-neutral-600 dark:text-neutral-400">Risk Bin</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Numerical risk category (1-5) where lower numbers indicate lower risk
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="font-medium">{poolData.predictions.binnedConfidence}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {chartData.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium mb-2">Projected Yield Over Time</p>
            <ChartContainer className="h-[200px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                    dataKey="yield"
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--color-yield)', strokeWidth: 1 }}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <ChartTooltipContent
                          payload={payload}
                          formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Projected Yield']}
                        />
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="yield"
                    name="yield"
                    strokeWidth={2}
                    dot={false}
                    fill="var(--color-yield)"
                    fillOpacity={0.2}
                    stroke="var(--color-yield)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default StakeResult;
