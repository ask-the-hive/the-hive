import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const getHeading = (result: LendingYieldsResultType) => {
    const pools = result.body || [];
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
    const isStableOnly =
      pools.length > 0 && pools.every((p) => stableCoins.includes((p.symbol || '').toUpperCase()));
    if (!pools.length) return 'No lending yields found';
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
    if (!body || !body.length) return;
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

    const matchingPool = body.find((pool) => {
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
  }, [body, messages, isResponseLoading, handleLendClick]);

  return (
    <>
      {!autoSelected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 mt-4">
          {body?.map((pool, index) => (
            <PoolDetailsCard
              key={`${pool.name}-${pool.project}-${index}`}
              pool={pool}
              index={index}
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
