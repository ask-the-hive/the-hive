import React, { useEffect } from 'react';
import Image from 'next/image';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { Card } from '@/components/ui';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ToolInvocation } from 'ai';
import type {
  LiquidStakingYieldsResultBodyType,
  LiquidStakingYieldsResultType,
  LiquidStakingYieldsPoolData,
} from '@/ai';

function capitalizeWords(str: string): string {
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Convert binnedConfidence (0-3) to confidence level label
function getConfidenceLabel(binValue: number): string {
  switch (binValue) {
    case 3:
      return 'High';
    case 2:
      return 'Medium';
    case 1:
      return 'Low';
    case 0:
      return 'Very Low';
    default:
      return 'Unknown';
  }
}

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LiquidStakingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting Best Liquid Staking Yields...`}
      result={{
        heading: (result: LiquidStakingYieldsResultType) =>
          result.body ? `Fetched Best Liquid Staking Yields` : 'No staking yields found',
        body: (result: LiquidStakingYieldsResultType) =>
          result.body ? <LiquidStakingYields body={result.body} /> : '',
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const LiquidStakingYields: React.FC<{
  body: LiquidStakingYieldsResultBodyType;
}> = ({ body }) => {
  const { sendMessage } = useChat();

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleStakeClick = async (poolData: LiquidStakingYieldsPoolData) => {
    const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
    sendMessage(`I want to stake SOL for ${symbol}`);
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 mt-10">
        {body?.map((pool, index) => (
          <Card
            key={`${pool.name}-${pool.project}-${index}`}
            className={cn(
              'flex flex-col gap-2 items-center p-4 cursor-pointer transition-all duration-300',
              index === 1
                ? 'hover:border-brand-600 dark:hover:border-brand-600 shadow-[0_0_10px_rgba(234,179,8,0.5)] dark:shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                : 'hover:border-brand-600/50 dark:hover:border-brand-600/50',
            )}
            onClick={() => handleStakeClick(pool)}
          >
            <div className="flex items-center flex-col justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Image
                  src={pool.tokenData?.logoURI || ''}
                  alt={pool.name}
                  width={30}
                  height={30}
                  className="w-6 h-6 rounded-full"
                />
                <h3 className="font-semibold text-lg">{pool.name}</h3>
              </div>

              {pool.project && <p className="font-medium">{capitalizeWords(pool.project)}</p>}
            </div>
            <div className="flex items-end gap-1 relative">
              <p className="text-2xl font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>
              <p className="text-gray-600 dark:text-gray-400 -top-[3px] relative">APY</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm mt-4">
              {pool.predictions && (
                <div className="flex flex-col items-center">
                  <p className="font-semibold text-md">
                    {getConfidenceLabel(pool.predictions.binnedConfidence)}
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-gray-600 text-xs dark:text-gray-400">APY Confidence</p>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-neutral-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-medium mb-1">
                            APY Prediction: {pool.predictions.predictedClass} -{' '}
                            {pool.predictions.predictedProbability}% confidence
                          </p>
                          <p className="text-xs">
                            Model Confidence:{' '}
                            {getConfidenceLabel(pool.predictions.binnedConfidence)}
                          </p>
                          <p className="text-xs mt-1">
                            DeFiLlama&apos;s confidence level in their 4-week APY prediction, based
                            on historical data accuracy and market conditions.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center">
                <p className="font-semibold text-md">${(pool.tvlUsd / 1000000).toFixed(1)}M</p>
                <p className="text-gray-600 text-xs dark:text-gray-400">TVL</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default LiquidStakingYieldsTool;
