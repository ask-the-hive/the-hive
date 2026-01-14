import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import { usePrivy } from '@privy-io/react-auth';
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

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const LendingYieldsTool: React.FC<Props> = ({ tool, prevToolAgent }) => {
  const { messages } = useChat();

  const detectRequestedSymbol = (msgs: typeof messages) => {
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return null;

    const stableCoins = [
      'USDC',
      'USDT',
      'USDC.E',
      'USDT.E',
      'USDX',
      'USDS',
      'USDG',
      'USDCso',
      'PYUSD',
      'FDUSD',
      'DAI',
      'EUROe',
      'EURC',
    ];

    const match = content.match(
      /\b(USDC\.E|USDT\.E|USDCso|USDC|USDT|USDX|USDS|USDG|PYUSD|FDUSD|DAI|EUROe|EURC)\b/i,
    );
    if (!match) return null;
    const symbol = match[1].toUpperCase();
    return stableCoins.includes(symbol) ? symbol : null;
  };

  const detectRequestedProvider = (msgs: typeof messages) => {
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return null;
    if (/jupiter\s+lend|jupiter\b/i.test(content)) return 'jupiter-lend';
    if (/kamino\b/i.test(content)) return 'kamino-lend';
    return null;
  };

  const requestedSymbolRef = useRef<string | null>(detectRequestedSymbol(messages));
  const requestedSymbol = requestedSymbolRef.current;
  const requestedProviderRef = useRef<string | null>(detectRequestedProvider(messages));
  const requestedProvider = requestedProviderRef.current;

  const loadingLabel = useMemo(() => {
    if (requestedSymbol && requestedProvider) {
      return `Fetching ${requestedSymbol} lending yields on ${capitalizeWords(
        requestedProvider.replace('-', ' '),
      )}...`;
    }
    if (requestedSymbol) return `Fetching ${requestedSymbol} lending yields...`;
    if (requestedProvider) {
      return `Fetching lending yields on ${capitalizeWords(requestedProvider.replace('-', ' '))}...`;
    }
    return 'Getting best lending yields...';
  }, [requestedProvider, requestedSymbol]);

  const getHeading = (result: LendingYieldsResultType) => {
    const pools = result.body || [];
    if (!pools.length) return 'No lending yields found';
    const stableCoins = [
      'USDC',
      'USDT',
      'USDC.E',
      'USDT.E',
      'USDX',
      'USDS',
      'USDG',
      'USDCso',
      'PYUSD',
      'FDUSD',
      'DAI',
      'EUROe',
      'EURC',
    ];
    const uniqueSymbols = Array.from(new Set(pools.map((p) => (p.symbol || '').toUpperCase())));
    const isStableOnly = uniqueSymbols.every((s) => stableCoins.includes(s));
    if (requestedSymbol && uniqueSymbols.includes(requestedSymbol)) {
      if (requestedProvider) {
        return `Fetched best ${requestedSymbol} lending yields on ${capitalizeWords(
          requestedProvider.replace('-', ' '),
        )}`;
      }
      return `Fetched best ${requestedSymbol} lending yields`;
    }
    if (requestedProvider) {
      return `Fetched best ${isStableOnly ? 'stablecoin ' : ''}lending yields on ${capitalizeWords(
        requestedProvider.replace('-', ' '),
      )}`;
    }
    if (uniqueSymbols.length === 1 && isStableOnly) {
      return `Fetched best ${uniqueSymbols[0]} lending yields`;
    }
    return isStableOnly ? 'Fetched best stablecoin lending yields' : 'Fetched best lending yields';
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
            <LendingYields
              body={result.body}
              requestedSymbol={requestedSymbol}
              requestedProvider={requestedProvider}
            />
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
  requestedSymbol?: string | null;
  requestedProvider?: string | null;
}> = ({ body, requestedSymbol, requestedProvider }) => {
  const { sendInternalMessage, isResponseLoading, messages } = useChat();
  const { currentWalletAddress, setCurrentChain } = useChain();
  const { login } = usePrivy();
  const [selectedPool, setSelectedPool] = useState<LendingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [pendingPoolId, setPendingPoolId] = useState<string | null>(null);
  const hasAutoSelectedRef = useRef(false);
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const detectRequestedSymbol = (msgs: typeof messages) => {
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return null;

    const stableCoins = [
      'USDC',
      'USDT',
      'USDC.E',
      'USDT.E',
      'USDX',
      'USDS',
      'USDG',
      'USDCso',
      'PYUSD',
      'FDUSD',
      'DAI',
      'EUROe',
      'EURC',
    ];

    const match = content.match(
      /\b(USDC\.E|USDT\.E|USDCso|USDC|USDT|USDX|USDS|USDG|PYUSD|FDUSD|DAI|EUROe|EURC)\b/i,
    );
    if (!match) return null;
    const symbol = match[1].toUpperCase();
    return stableCoins.includes(symbol) ? symbol : null;
  };

  const requestedSymbolRef = useRef<string | null>(
    requestedSymbol ?? detectRequestedSymbol(messages),
  );
  const symbolToFilter = requestedSymbolRef.current;

  const detectRequestedProvider = (msgs: typeof messages) => {
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return null;
    if (/jupiter\s+lend|jupiter\b/i.test(content)) return 'jupiter-lend';
    if (/kamino\b/i.test(content)) return 'kamino-lend';
    return null;
  };

  const requestedProviderRef = useRef<string | null>(
    requestedProvider ?? detectRequestedProvider(messages),
  );
  const providerToFilter = requestedProviderRef.current;
  const wantsAllPoolsRef = useRef<boolean | null>(null);
  if (wantsAllPoolsRef.current === null) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    wantsAllPoolsRef.current = /\b(all|every|entire|full\s+list|show\s+all|fetch\s+all|list\s+all)\b/i.test(
      content || '',
    );
  }
  const wantsAllPools = wantsAllPoolsRef.current;

  const poolsToShow = useMemo(() => {
    if (!body) return [];
    let pools = body;
    if (symbolToFilter) {
      const filtered = pools.filter((pool) => (pool.symbol || '').toUpperCase() === symbolToFilter);
      pools = filtered.length > 0 ? filtered : pools;
    }
    if (providerToFilter) {
      const filteredByProvider = pools.filter(
        (pool) => (pool.project || '').toLowerCase() === providerToFilter.toLowerCase(),
      );
      pools = filteredByProvider.length > 0 ? filteredByProvider : pools;
    }
    return pools;
  }, [body, symbolToFilter, providerToFilter]);

  const displayPools = useMemo(() => {
    if (!poolsToShow) return [];
    if (wantsAllPools) return poolsToShow;
    if (poolsToShow.length <= 3) return poolsToShow;
    const [best, second, ...rest] = poolsToShow
      .slice()
      .sort((a, b) => (b.yield || 0) - (a.yield || 0));
    const third = rest[0];
    const trio = [second ?? best, best, third ?? second ?? best].filter(Boolean);
    return trio.slice(0, 3) as typeof poolsToShow;
  }, [poolsToShow, wantsAllPools]);

  const highlightIndex = useMemo(() => {
    if (!displayPools.length) return 0;
    let bestIdx = 0;
    let bestYield = Number.NEGATIVE_INFINITY;
    displayPools.forEach((pool, idx) => {
      const y = pool.yield || 0;
      if (y > bestYield) {
        bestYield = y;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [displayPools]);

  const handleLendClick = useCallback(
    async (poolData: LendingYieldsPoolData) => {
      if (isResponseLoading) return;

      setCurrentChain('solana');
      if (!currentWalletAddress) {
        login?.();
        return;
      }

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const tokenAddress = poolData?.tokenMintAddress || poolData?.tokenData?.id;
      const pendingId = tokenAddress || poolData.name;

      setPendingPoolId(pendingId);
      setIsDisabled(true);

      sendInternalMessage(
        `I want to lend ${symbol} (${tokenAddress}) to ${capitalizeWords(poolData.project)}`,
      );
    },
    [isResponseLoading, sendInternalMessage],
  );

  const handleMoreDetailsClick = (poolData: LendingYieldsPoolData, event: React.MouseEvent) => {
    event.stopPropagation();

    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isResponseLoading) {
      setIsDisabled(false);
      setPendingPoolId(null);
    }
  }, [isResponseLoading]);

  useEffect(() => {
    if (!poolsToShow || !poolsToShow.length) return;
    if (hasAutoSelectedRef.current) return;
    if (isResponseLoading) return;

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return;

    const match =
      content.match(
        /lend\s+(?:[0-9.,]+\s+)?([A-Za-z0-9]+)\s+(?:to|using)\s+([A-Za-z0-9\s]+?)(?:\.|$)/i,
      ) || null;

    if (!match) return;

    const [, tokenSymbolRaw, protocolRaw] = match;
    const tokenSymbol = tokenSymbolRaw.toUpperCase();
    const protocol = protocolRaw.trim().toLowerCase();
    const supportedStablecoins = ['USDC', 'USDT', 'USDG', 'EURC', 'FDUSD', 'PYUSD', 'USDS', 'USDY'];

    if (!supportedStablecoins.includes(tokenSymbol)) return;

    const matchingPool = poolsToShow.find((pool) => {
      const poolSymbol = (pool.symbol || '').toUpperCase();
      const project = (pool.project || '').toLowerCase();
      const projectMatches =
        project.includes(protocol) ||
        protocol.includes(project) ||
        (project.includes('jupiter') && protocol.includes('jupiter'));

      return poolSymbol === tokenSymbol && projectMatches;
    });

    if (!matchingPool) return;

    hasAutoSelectedRef.current = true;
    setAutoSelected(true);
    handleLendClick(matchingPool);
  }, [poolsToShow, messages, isResponseLoading, handleLendClick]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
        {displayPools?.map((pool, index) => (
          <PoolDetailsCard
            key={`${pool.name}-${pool.project}-${index}`}
            pool={pool}
            index={index}
            highlightIndex={highlightIndex}
            onClick={handleLendClick}
            onMoreDetailsClick={handleMoreDetailsClick}
            disabled={isDisabled}
            isPending={
              pendingPoolId === (pool.tokenMintAddress || pool.tokenData?.id || pool.name)
            }
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
