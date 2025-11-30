import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import ToolCard from '../../tool-card';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import PoolDetailsModal from './pool-details-modal';
import PoolDetailsCard from '../pool-details-card';

import type { ToolInvocation } from 'ai';
import type {
  LiquidStakingYieldsResultBodyType,
  LiquidStakingYieldsResultType,
  LiquidStakingYieldsPoolData,
} from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LiquidStakingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting best liquid staking yields...`}
      result={{
        heading: (result: LiquidStakingYieldsResultType) =>
          result.body ? `Fetched best liquid staking yields` : 'No staking yields found',
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
  const { sendMessage, isResponseLoading } = useChat();
  const [selectedPool, setSelectedPool] = useState<LiquidStakingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleStakeClick = async (poolData: LiquidStakingYieldsPoolData) => {
    if (isResponseLoading) return;

    const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
    sendMessage(`I want to stake SOL for ${symbol}`);
  };

  const handleMoreDetailsClick = (
    poolData: LiquidStakingYieldsPoolData,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent triggering the stake click
    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isResponseLoading) {
      setTimeout(() => {
        setIsDisabled(false);
      }, 2000);
    }
  }, [isResponseLoading]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {body?.map((pool, index) => (
          <PoolDetailsCard
            key={`${pool.name}-${pool.project}-${index}`}
            pool={pool}
            index={index}
            onClick={handleStakeClick}
            onMoreDetailsClick={handleMoreDetailsClick}
            disabled={isDisabled}
          />
        ))}
      </div>

      {/* Modal */}
      <PoolDetailsModal
        pool={selectedPool}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPool(null);
        }}
      />
    </>
  );
};

export default LiquidStakingYieldsTool;
