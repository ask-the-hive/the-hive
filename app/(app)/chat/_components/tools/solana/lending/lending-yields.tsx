import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import ToolCard from '../../tool-card';
import { SOLANA_LENDING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';
import { capitalizeWords } from '@/lib/string-utils';
import PoolDetailsModal from '../staking/pool-details-modal';
import PoolDetailsCard from '../pool-details-card';
import type { ToolInvocation } from 'ai';
import type {
  LendingYieldsResultBodyType,
  LendingYieldsResultType,
  LendingYieldsPoolData,
} from '@/ai/solana/actions/lending/lending-yields/schema';
import { isSupportedSolanaLendingStablecoin } from '@/lib/yield-support';
import { resolveLendingProjectKey } from '@/lib/lending';

const shouldShowAll = (limit?: number) => Number.isFinite(limit) && (limit ?? 0) > 3;
const LOOP_GUARD_MESSAGE =
  'Tool call blocked to prevent repeating the same request in a single turn.';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LendingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  if (
    tool.state === 'result' &&
    'result' in tool &&
    (tool.result as LendingYieldsResultType).message === LOOP_GUARD_MESSAGE
  ) {
    return null;
  }

  const args = (tool.args || {}) as Partial<{
    symbol: string;
    project: string;
    limit: number;
  }>;
  const sortBy = String((tool.args as any)?.sortBy || 'apy').toLowerCase();
  const limit = typeof args.limit === 'number' ? args.limit : undefined;

  const requestedSymbolRef = useRef<string | null>(
    args.symbol && isSupportedSolanaLendingStablecoin(args.symbol)
      ? args.symbol.toUpperCase()
      : null,
  );
  const requestedSymbol = requestedSymbolRef.current;

  const requestedProvider = useRef(resolveLendingProjectKey(args.project)).current;

  const loadingLabel = useMemo(() => {
    if (requestedSymbol && requestedProvider) {
      return `Fetching ${sortBy === 'tvl' ? 'highest TVL ' : ''}${requestedSymbol} lending yields on ${capitalizeWords(
        requestedProvider.replace('-', ' '),
      )}...`;
    }
    if (requestedSymbol)
      return `Fetching ${sortBy === 'tvl' ? 'highest TVL ' : ''}${requestedSymbol} lending yields...`;
    if (requestedProvider) {
      return `Fetching ${sortBy === 'tvl' ? 'highest TVL ' : ''}lending yields on ${capitalizeWords(
        requestedProvider.replace('-', ' '),
      )}...`;
    }
    return sortBy === 'tvl' ? 'Getting highest TVL lending yields...' : 'Getting best lending yields...';
  }, [requestedProvider, requestedSymbol, sortBy]);

  const getHeading = (result: LendingYieldsResultType) => {
    const pools = result.body || [];
    if (!pools.length) return 'No lending yields found';
    const uniqueSymbols = Array.from(new Set(pools.map((p) => (p.symbol || '').toUpperCase())));
    const isStableOnly = uniqueSymbols.every((s) => isSupportedSolanaLendingStablecoin(s));
    const prefix = sortBy === 'tvl' ? 'Fetched highest TVL' : 'Fetched best';
    if (requestedSymbol && uniqueSymbols.includes(requestedSymbol)) {
      if (requestedProvider) {
        return `${prefix} ${requestedSymbol} lending yields on ${capitalizeWords(
          requestedProvider.replace('-', ' '),
        )}`;
      }
      return `${prefix} ${requestedSymbol} lending yields`;
    }
    if (requestedProvider) {
      return `${prefix} ${isStableOnly ? 'stablecoin ' : ''}lending yields on ${capitalizeWords(
        requestedProvider.replace('-', ' '),
      )}`;
    }
    if (uniqueSymbols.length === 1 && isStableOnly) {
      return `${prefix} ${uniqueSymbols[0]} lending yields`;
    }
    return isStableOnly
      ? `${prefix} stablecoin lending yields`
      : `${prefix} lending yields`;
  };

  return (
    <ToolCard
      tool={tool}
      loadingText={loadingLabel}
      disableCollapseAnimation
      result={{
        heading: (result: LendingYieldsResultType) => getHeading(result),
        body: (result: LendingYieldsResultType) =>
          result.body ? (
            <LendingYields body={result.body} sortBy={sortBy} limit={limit} toolState={tool.state} />
          ) : (
            ''
          ),
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const LendingYields: React.FC<{
  body: LendingYieldsResultBodyType;
  sortBy?: string;
  limit?: number;
  toolState?: string;
}> = ({ body, sortBy, limit, toolState }) => {
  const { sendClientAction } = useChat();
  const { setCurrentChain } = useChain();
  const [selectedPool, setSelectedPool] = useState<LendingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showAllRef = useRef(shouldShowAll(limit));
  const interactionReady = toolState !== 'call' && toolState !== 'partial-call';

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const sortedPools = useMemo(() => {
    const pools = body ?? [];
    const sortKey = String(sortBy || 'apy').toLowerCase();
    return pools.slice().sort((a, b) => {
      if (sortKey === 'tvl') return (b.tvlUsd || 0) - (a.tvlUsd || 0);
      return (b.yield || 0) - (a.yield || 0);
    });
  }, [body, sortBy]);

  const displayPools = useMemo(() => {
    if (showAllRef.current) return sortedPools;
    return sortedPools.slice(0, Math.min(3, sortedPools.length));
  }, [sortedPools]);

  const arrangedPools = useMemo(() => {
    if (displayPools.length !== 3) return displayPools;
    const sorted = displayPools.slice().sort((a, b) => (b.yield || 0) - (a.yield || 0));
    const [best, second, third] = sorted;
    return [second ?? best, best, third ?? second ?? best].filter(Boolean);
  }, [displayPools]);

  const highlightIndex = useMemo(() => {
    if (!arrangedPools.length) return 0;
    let bestIdx = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    arrangedPools.forEach((pool, idx) => {
      const score =
        String(sortBy || 'apy').toLowerCase() === 'tvl' ? pool.tvlUsd || 0 : pool.yield || 0;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [arrangedPools, sortBy]);

  const openDetails = useCallback((poolData: LendingYieldsPoolData) => {
    setSelectedPool(poolData);
    setIsModalOpen(true);
  }, []);

  const handleExecuteClick = useCallback(
    async (poolData: LendingYieldsPoolData) => {
      if (!interactionReady) return;

      setCurrentChain('solana');

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const tokenAddress = poolData?.tokenMintAddress || poolData?.tokenData?.id;

      sendClientAction(
        `I want to deposit ${symbol} (${tokenAddress}) into ${capitalizeWords(poolData.project)}`,
        {
          type: 'execute_lend',
          chain: 'solana',
          tokenSymbol: String(symbol || ''),
          tokenAddress: String(tokenAddress || ''),
          protocol: String(poolData.project || ''),
        },
        { visible: true },
      );
    },
    [interactionReady, sendClientAction, setCurrentChain],
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {arrangedPools?.map((pool, index) => (
          <PoolDetailsCard
            key={`${pool.project || 'unknown'}-${pool.tokenMintAddress || pool.underlyingTokens?.[0] || pool.tokenData?.id || pool.name}`}
            pool={pool}
            index={index}
            highlightIndex={highlightIndex}
            primaryActionLabel="Lend now"
            onPrimaryAction={handleExecuteClick}
            onOpenDetails={openDetails}
            disabled={!interactionReady}
          />
        ))}
      </div>

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
