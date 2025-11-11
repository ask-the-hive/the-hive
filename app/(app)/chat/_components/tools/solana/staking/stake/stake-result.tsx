import React, { useMemo, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Token } from '@/db/types';
import { LiquidStakingYieldsPoolData } from '@/ai';
import { usePrice } from '@/hooks';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Card } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function capitalizeWords(str: string): string {
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate quarters for 2 years: [3,6,9,12,15,18,21,24]
const MONTHS = Array.from({ length: 8 }, (_, i) => (i + 1) * 3);

interface Props {
  outputTokenData?: Token;
  poolData?: LiquidStakingYieldsPoolData;
  outputAmount?: number;
  tx?: string;
}

const StakeResult: React.FC<Props> = ({ outputTokenData, poolData, outputAmount, tx }) => {
  const { user } = usePrivy();
  const { data: outputTokenPrice } = usePrice(outputTokenData?.id || '');
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const amountUSD = useMemo(() => {
    if (!outputAmount || !outputTokenPrice) return null;
    return outputAmount * outputTokenPrice.value;
  }, [outputAmount, outputTokenPrice]);

  const handleViewPortfolio = async () => {
    if (!user?.wallet?.address || isNavigating) return;

    setIsNavigating(true);
    try {
      await router.push(`/portfolio/${user.wallet.address}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  };

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
    <div className="flex flex-col gap-2">
      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        You have successfully staked {outputTokenData?.symbol}!
      </p>

      {(poolData || chartData.length > 0) && (
        <Card className="bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          {poolData && (
            <div className="p-4 rounded-lg">
              <div className="flex items-center flex-col justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Image
                    src={poolData.tokenData?.logoURI || ''}
                    alt={poolData.name}
                    width={30}
                    height={30}
                    className="w-6 h-6 rounded-full"
                  />
                  <h3 className="font-semibold text-lg">{poolData.name}</h3>
                </div>

                {poolData.project && (
                  <p className="font-medium">{capitalizeWords(poolData.project)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 pb-4 mt-4 items-center">
                <div className="flex flex-col items-center">
                  <p className="text-xl font-semibold text-neutral-600 dark:text-neutral-400">
                    {String(outputAmount)?.length > 8 ? outputAmount?.toFixed(6) : outputAmount}{' '}
                    {outputTokenData?.symbol} {amountUSD && ` / $${amountUSD.toFixed(2)}`}
                  </p>
                  <p className="text-gray-600 text-sm dark:text-gray-400">Amount</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xl font-semibold text-green-600">
                    {poolData.yield.toFixed(2)}% APY
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Earning</p>
                </div>
              </div>
            </div>
          )}
          {chartData.length > 0 && (
            <div className="mt-4 w-full p-4">
              <p className="text-lg font-medium mb-2">Projected Yield Over Time</p>
              <ChartContainer className="h-[200px] w-full" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
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
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <ChartTooltipContent
                            active={active}
                            payload={payload}
                            formatter={(value) => `$${Number(value).toFixed(2)}`}
                          />
                        );
                      }}
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
          <div className="mt-6 mb-6 flex flex-col gap-2 px-4">
            {user?.wallet?.address && (
              <Button
                variant="brand"
                className="w-full"
                onClick={handleViewPortfolio}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'View Portfolio'
                )}
              </Button>
            )}
            {tx && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://solscan.io/tx/${tx}`, '_blank')}
              >
                View Transaction
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StakeResult;
