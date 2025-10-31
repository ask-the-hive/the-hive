import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { Card, Button } from '@/components/ui';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import PoolDetailsModal from '../staking/pool-details-modal';

import type { ToolInvocation } from 'ai';
import type {
  LendingYieldsResultBodyType,
  LendingYieldsResultType,
  LendingYieldsPoolData,
} from '@/ai/solana/actions/lending/lending-yields/schema';
import VarApyTooltip from '@/components/var-apy-tooltip';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LendingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting best lending yields...`}
      result={{
        heading: (result: LendingYieldsResultType) =>
          result.body ? `Fetched best lending yields` : 'No lending yields found',
        body: (result: LendingYieldsResultType) =>
          result.body ? <LendingYields body={result.body} /> : '',
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const LendingYields: React.FC<{
  body: LendingYieldsResultBodyType;
}> = ({ body }) => {
  const { sendMessage } = useChat();
  const [selectedPool, setSelectedPool] = useState<LendingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleLendClick = async (poolData: LendingYieldsPoolData) => {
    const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
    sendMessage(`I want to lend ${symbol} to ${poolData.project}`);
  };

  const handleMoreDetailsClick = (poolData: LendingYieldsPoolData, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the lend click
    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {body?.map((pool, index) => (
          <Card
            key={`${pool.name}-${pool.project}-${index}`}
            className={cn(
              'group relative flex flex-col gap-2 items-center p-4 cursor-pointer transition-all duration-300 overflow-hidden',
              index === 1
                ? 'hover:border-brand-600 dark:hover:border-brand-600 !shadow-[0_0_10px_rgba(234,179,8,0.5)] dark:!shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                : 'hover:border-brand-600/50 dark:hover:border-brand-600/50',
            )}
            onClick={() => handleLendClick(pool)}
          >
            <div className="items-center flex-col justify-between gap-2 mb-2 hidden md:flex">
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

            <div className="items-end gap-1 relative hidden md:flex ">
              <p className="text-2xl font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>

              <div className="flex items-center gap-1 -top-[3px] relative">
                <p className="text-gray-600 dark:text-gray-400 relative text-xs">APY</p>
                <VarApyTooltip size="xs" />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between w-full md:hidden">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src={pool.tokenData?.logoURI || ''}
                  alt={pool.name}
                  width={36}
                  height={36}
                  className="w-8 h-8 rounded-full"
                />
                <div className="items-center flex-col justify-between gap-2">
                  <h3 className="font-semibold text-md">{pool.name}</h3>
                  {pool.project && (
                    <p className="text-xs font-medium">{capitalizeWords(pool.project)}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 relative">
                <p className="text-2xl font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>
                <div className="flex items-center gap-1 -top-[3px] relative">
                  <p className="text-gray-600 dark:text-gray-400 relative text-xs">APY</p>
                  <VarApyTooltip size="xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm mt-4">
              {pool.predictions && (
                <div className="flex flex-col items-center">
                  <p className="font-semibold text-md">
                    {getConfidenceLabel(Number(pool.predictions.binnedConfidence))}
                  </p>
                  <p className="text-gray-600 text-xs dark:text-gray-400">APY Confidence</p>
                </div>
              )}
              <div className="flex flex-col items-center">
                <p className="font-semibold text-md">${(pool.tvlUsd / 1000000).toFixed(1)}M</p>
                <p className="text-gray-600 text-xs dark:text-gray-400">TVL</p>
              </div>
            </div>

            {/* More Details Button - Inline on mobile, absolute on desktop */}
            <div className="mt-4 md:absolute md:bottom-0 md:left-0 md:right-0 md:transform md:translate-y-full md:group-hover:translate-y-0 md:transition-transform md:duration-300 md:ease-in-out md:bg-white md:dark:bg-neutral-800 md:border-t md:border-gray-200 md:dark:border-gray-700 md:p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => handleMoreDetailsClick(pool, e)}
              >
                More Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <PoolDetailsModal
        pool={selectedPool}
        isOpen={isModalOpen}
        variant="lending"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPool(null);
        }}
      />
    </>
  );
};

export default LendingYieldsTool;
