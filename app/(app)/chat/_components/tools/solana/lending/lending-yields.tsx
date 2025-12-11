import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
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

  const detectSpecificPoolIntent = (msgs: typeof messages) => {
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    const content = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
    if (!content) return false;
    return /lend\s+(?:[0-9.,]+\s+)?[A-Za-z0-9]+\s+(?:to|using)\s+[A-Za-z0-9\s]+/i.test(content);
  };

  const requestedSymbolRef = useRef<string | null>(detectRequestedSymbol(messages));
  const requestedSymbol = requestedSymbolRef.current;
  const skipYieldsUI = requestedSymbol && detectSpecificPoolIntent(messages);

  const getHeading = (result: LendingYieldsResultType) => {
    if (skipYieldsUI) return '';
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
      return `Fetched best ${requestedSymbol} lending yields`;
    }
    if (uniqueSymbols.length === 1 && isStableOnly) {
      return `Fetched best ${uniqueSymbols[0]} lending yields`;
    }
    return isStableOnly ? 'Fetched best stablecoin lending yields' : 'Fetched best lending yields';
  };

  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting best lending yields...`}
      disableCollapseAnimation
      result={{
        heading: (result: LendingYieldsResultType) => getHeading(result),
        body: (result: LendingYieldsResultType) =>
          !skipYieldsUI && result.body ? <LendingYields body={result.body} /> : '',
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const LendingYields: React.FC<{
  body: LendingYieldsResultBodyType;
}> = ({ body }) => {
  const { sendInternalMessage, isResponseLoading, messages } = useChat();
  const [selectedPool, setSelectedPool] = useState<LendingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
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

  const requestedSymbolRef = useRef<string | null>(detectRequestedSymbol(messages));
  const requestedSymbol = requestedSymbolRef.current;

  const poolsToShow = useMemo(() => {
    if (!body) return [];
    if (!requestedSymbol) return body;
    const filtered = body.filter((pool) => (pool.symbol || '').toUpperCase() === requestedSymbol);
    return filtered.length > 0 ? filtered : body;
  }, [body, requestedSymbol]);

  const displayPools = useMemo(() => {
    if (!poolsToShow) return [];
    if (!requestedSymbol) {
      const topThree = poolsToShow.slice(0, 3);
      if (topThree.length >= 3) {
        const [first, second, third] = topThree;
        return [second ?? first, first ?? second, third].filter(Boolean) as typeof poolsToShow;
      }
      return topThree;
    }
    return poolsToShow;
  }, [poolsToShow, requestedSymbol]);

  const highlightIndex = !requestedSymbol && displayPools.length >= 3 ? 1 : 0;

  const handleLendClick = useCallback(
    async (poolData: LendingYieldsPoolData) => {
      if (isResponseLoading) return;

      const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
      const tokenAddress = poolData?.tokenMintAddress || poolData?.tokenData?.id;

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

  if (autoSelected && requestedSymbol) {
    return null;
  }

  return (
    <>
      {!autoSelected && (
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
            />
          ))}
        </div>
      )}

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
