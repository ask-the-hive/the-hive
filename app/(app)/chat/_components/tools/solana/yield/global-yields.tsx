import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import { usePrivy } from '@privy-io/react-auth';
import ToolCard from '../../tool-card';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY, SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { capitalizeWords } from '@/lib/string-utils';
import PoolDetailsModal from '../staking/pool-details-modal';
import PoolDetailsCard from '../pool-details-card';
import type { ToolInvocation } from 'ai';
import { useLogin } from '@/hooks';
import type {
  GlobalYieldsResultBodyType,
  GlobalYieldsResultType,
  GlobalYieldsPoolData,
} from '@/ai/solana/actions/yield/types';
import type { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';
import type { LiquidStakingYieldsPoolData } from '@/ai/solana/actions/staking/liquid-staking-yields/types';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GlobalYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Getting best yields across all strategies..."
      disableCollapseAnimation
      result={{
        heading: (result: GlobalYieldsResultType) =>
          result.body ? `Fetched best yields across lending and staking` : 'No yields found',
        body: (result: GlobalYieldsResultType) =>
          result.body ? <GlobalYields body={result.body} /> : '',
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const GlobalYields: React.FC<{
  body: GlobalYieldsResultBodyType;
}> = ({ body }) => {
  const { sendInternalMessage, isResponseLoading } = useChat();
  const { currentWalletAddress, setCurrentChain } = useChain();
  const { login } = usePrivy();
  const { user, connectWallet, ready } = useLogin();
  const [selectedPool, setSelectedPool] = useState<GlobalYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    if (!body) return;
    
    // Separate lending and staking pools for storage
    const lendingPools = body.filter((p) => p.yieldType === 'lending') as LendingYieldsPoolData[];
    const stakingPools = body.filter((p) => p.yieldType === 'staking') as LiquidStakingYieldsPoolData[];
    
    if (lendingPools.length > 0) {
      sessionStorage.setItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY, JSON.stringify(lendingPools));
    }
    if (stakingPools.length > 0) {
      sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(stakingPools));
    }
  }, [body]);

  const handlePoolClick = useCallback(
    async (poolData: GlobalYieldsPoolData) => {
      if (isResponseLoading) return;

      setCurrentChain('solana');
      
      if (poolData.yieldType === 'lending') {
        // Route to lending flow
        if (!currentWalletAddress) {
          login?.();
          return;
        }

        const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
        const tokenAddress = poolData?.tokenMintAddress || poolData?.tokenData?.id;
        
        setIsDisabled(true);
        sendInternalMessage(
          `I want to lend ${symbol} (${tokenAddress}) to ${capitalizeWords(poolData.project)}`,
        );
      } else if (poolData.yieldType === 'staking') {
        // Route to staking flow
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
        sendInternalMessage(`I want to stake SOL for ${symbol}`);
      }
    },
    [isResponseLoading, sendInternalMessage, currentWalletAddress, login, user, ready, connectWallet, setCurrentChain],
  );

  const handleMoreDetailsClick = (poolData: GlobalYieldsPoolData, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isResponseLoading) {
      setIsDisabled(false);
    }
  }, [isResponseLoading]);

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
            key={`${pool.name}-${pool.project}-${pool.yieldType}-${index}`}
            pool={pool}
            index={index}
            highlightIndex={bestIndex}
            onClick={handlePoolClick}
            onMoreDetailsClick={handleMoreDetailsClick}
            disabled={isDisabled}
          />
        ))}
      </div>

      <PoolDetailsModal
        pool={selectedPool}
        isOpen={isModalOpen}
        variant={selectedPool?.yieldType === 'lending' ? 'lending' : 'staking'}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPool(null);
        }}
      />
    </>
  );
};

export default GlobalYieldsTool;
