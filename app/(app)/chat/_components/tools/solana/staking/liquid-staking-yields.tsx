import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
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

const shouldShowAll = (limit?: number) => Number.isFinite(limit) && (limit ?? 0) > 3;
const LOOP_GUARD_MESSAGE =
  'Tool call blocked to prevent repeating the same request in a single turn.';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LiquidStakingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  if (
    tool.state === 'result' &&
    'result' in tool &&
    (tool.result as LiquidStakingYieldsResultType).message === LOOP_GUARD_MESSAGE
  ) {
    return null;
  }

  const args = (tool.args || {}) as Partial<{ limit: number }>;
  const sortBy = String((tool.args as any)?.sortBy || 'apy').toLowerCase();
  const limit = typeof args.limit === 'number' ? args.limit : undefined;

  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting best liquid staking yields...`}
      disableCollapseAnimation
      result={{
        heading: (result: LiquidStakingYieldsResultType) =>
          result.body ? `Fetched best liquid staking yields` : 'No staking yields found',
        body: (result: LiquidStakingYieldsResultType) =>
          result.body ? (
            <LiquidStakingYields body={result.body} sortBy={sortBy} limit={limit} toolState={tool.state} />
          ) : (
            ''
          ),
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const LiquidStakingYields: React.FC<{
  body: LiquidStakingYieldsResultBodyType;
  sortBy?: string;
  limit?: number;
  toolState?: string;
}> = ({ body, sortBy, limit, toolState }) => {
  const { sendClientAction } = useChat();
  const { setCurrentChain } = useChain();
  const [selectedPool, setSelectedPool] = useState<LiquidStakingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showAllRef = useRef(shouldShowAll(limit));
  const interactionReady = toolState !== 'call' && toolState !== 'partial-call';

  const openDetails = React.useCallback((poolData: LiquidStakingYieldsPoolData) => {
    setSelectedPool(poolData);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleStakeClick = React.useCallback(
    async (poolData: LiquidStakingYieldsPoolData) => {
      if (!interactionReady) return;

      setCurrentChain('solana');

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const contractAddress = poolData?.tokenData?.id || '';
      sendClientAction(
        `I want to stake SOL into ${symbol}`,
        {
          type: 'execute_stake',
          chain: 'solana',
          lstSymbol: String(symbol || ''),
          contractAddress,
        },
        { visible: true },
      );
    },
    [interactionReady, sendClientAction, setCurrentChain],
  );

  const sortedPools = React.useMemo(() => {
    const pools = body ?? [];
    const sortKey = String(sortBy || 'apy').toLowerCase();
    return pools.slice().sort((a, b) => {
      if (sortKey === 'tvl') return (b.tvlUsd || 0) - (a.tvlUsd || 0);
      return (b.yield || 0) - (a.yield || 0);
    });
  }, [body, sortBy]);

  const displayPools = React.useMemo(() => {
    if (showAllRef.current) return sortedPools;
    return sortedPools.slice(0, Math.min(3, sortedPools.length));
  }, [sortedPools]);

  const arrangedPools = React.useMemo(() => {
    if (displayPools.length !== 3) return displayPools;
    const [best, second, third] = displayPools;
    return [second ?? best, best, third ?? second ?? best].filter(Boolean);
  }, [displayPools]);

  const highlightIndex = React.useMemo(() => {
    if (!arrangedPools.length) return 0;
    let bestIdx = 0;
    let bestYield = Number.NEGATIVE_INFINITY;
    arrangedPools.forEach((pool, idx) => {
      const score =
        String(sortBy || 'apy').toLowerCase() === 'tvl' ? pool.tvlUsd || 0 : pool.yield || 0;
      if (score > bestYield) {
        bestYield = score;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [arrangedPools, sortBy]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {arrangedPools.map((pool, index) => (
          <PoolDetailsCard
            key={`${pool.project || 'unknown'}-${pool.poolMeta || pool.underlyingTokens?.[0] || pool.tokenData?.id || pool.name}`}
            pool={pool}
            index={index}
            highlightIndex={highlightIndex}
            primaryActionLabel="Stake now"
            onPrimaryAction={handleStakeClick}
            onOpenDetails={openDetails}
            disabled={!interactionReady}
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
