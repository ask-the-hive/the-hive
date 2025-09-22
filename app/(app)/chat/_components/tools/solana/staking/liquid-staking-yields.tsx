import React from 'react';
import Image from 'next/image';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { Card } from '@/components/ui';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';

import type { ToolInvocation } from 'ai';
import type { LiquidStakingYieldsResultBodyType, LiquidStakingYieldsResultType } from '@/ai';

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

  const handleStakeClick = async (poolData: any) => {
    // Store pool data in sessionStorage for the agent to access
    sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(poolData));

    const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
    sendMessage(`I want to stake SOL for ${symbol}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {body?.map((pool, index) => (
        <Card
          key={`${pool.name}-${pool.project}-${index}`}
          className="flex flex-col gap-2 items-center p-2 cursor-pointer hover:border-brand-600 dark:hover:border-brand-600 transition-all duration-300"
          onClick={() => handleStakeClick(pool)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Image
              src={pool.tokenData?.logoURI || ''}
              alt={pool.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
            <h3 className="font-semibold text-lg">{pool.name}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Current Yield</p>
              <p className="font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>
            </div>
            {/* <div>
              <p className="text-gray-600 dark:text-gray-400">APY Base</p>
              <p className="font-semibold">{pool.apyBase.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">APY Reward</p>
              <p className="font-semibold">{pool.apyReward.toFixed(2)}%</p>
            </div> */}
            <div>
              <p className="text-gray-600 dark:text-gray-400">TVL</p>
              <p className="font-semibold">${(pool.tvlUsd / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-gray-600 dark:text-gray-400">Project</p>
            <p className="font-medium">{pool.project}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default LiquidStakingYieldsTool;
