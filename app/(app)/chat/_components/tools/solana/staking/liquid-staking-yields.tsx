import React, { useEffect, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import ToolCard from '../../tool-card';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import PoolDetailsModal from './pool-details-modal';
import PoolDetailsCard from '../pool-details-card';
import type { ToolInvocation } from 'ai';
import { useLogin } from '@/hooks';
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
  const { currentWalletAddress, setCurrentChain } = useChain();
  const { user, login, linkWallet, connectWallet, ready } = useLogin();
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

  const handleStakeClick = React.useCallback(
    async (poolData: LiquidStakingYieldsPoolData, internal = false) => {
      if (isResponseLoading) return;

      setCurrentChain('solana');
      if (!ready) return;

      if (!user) {
        login?.();
        return;
      }

      if (!currentWalletAddress) {
        connectWallet();
        return;
      }

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const sender = internal ? sendInternalMessage : sendMessage;
      sender(`I want to stake SOL for ${symbol}`);
    },
    [
      isResponseLoading,
      sendInternalMessage,
      sendMessage,
      currentWalletAddress,
      login,
      linkWallet,
      connectWallet,
      setCurrentChain,
      user,
      ready,
    ],
  );

  const handleMoreDetailsClick = (
    poolData: LiquidStakingYieldsPoolData,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isResponseLoading) {
      setIsDisabled(false);
    }
  }, [isResponseLoading]);

  useEffect(() => {
    if (!body || !body.length) return;
    if (isResponseLoading) return;
  }, [body, isResponseLoading, messages]);

  const pools = body ?? [];
  const bestIndex = pools.reduce(
    (best, pool, idx) => {
      const y = pool.yield || 0;
      return y > best.yield ? { idx, yield: y } : best;
    },
    { idx: 0, yield: Number.NEGATIVE_INFINITY },
  ).idx;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {pools.map((pool, index) => (
          <PoolDetailsCard
            key={`${pool.name}-${pool.project}-${index}`}
            pool={pool}
            index={index}
            highlightIndex={bestIndex}
            onClick={handleStakeClick}
            onMoreDetailsClick={handleMoreDetailsClick}
            disabled={isDisabled}
          />
        ))}
      </div>

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
