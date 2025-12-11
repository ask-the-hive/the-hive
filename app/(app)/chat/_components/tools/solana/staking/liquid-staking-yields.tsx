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
      disableCollapseAnimation
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
  const { sendMessage, sendInternalMessage, isResponseLoading, messages } = useChat();
  const [selectedPool, setSelectedPool] = useState<LiquidStakingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const hasAutoSelectedRef = React.useRef(false);
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleStakeClick = React.useCallback(
    async (poolData: LiquidStakingYieldsPoolData, internal = false) => {
      if (isResponseLoading) return;

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const sender = internal ? sendInternalMessage : sendMessage;
      sender(`I want to stake SOL for ${symbol}`);
    },
    [isResponseLoading, sendInternalMessage, sendMessage],
  );

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
      setIsDisabled(false);
    }
  }, [isResponseLoading]);

  // Auto-select the highest APY pool and start the staking flow with a confirmation prompt,
  // to avoid redundant "pick a card" messaging.
  useEffect(() => {
    if (!body || !body.length) return;
    if (hasAutoSelectedRef.current) return;
    if (isResponseLoading) return;

    const bestPool =
      body.reduce((best, pool) => ((pool.yield || 0) > (best?.yield || 0) ? pool : best), body[0]) ||
      null;

    if (!bestPool) return;

    hasAutoSelectedRef.current = true;
    setAutoSelected(true);
    // Send internally so the UI doesn't show an extra user bubble
    handleStakeClick(bestPool, true);
  }, [body, isResponseLoading, handleStakeClick, messages]);

  return (
    <>
      {!autoSelected && (
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
      )}

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
