import React, { useEffect, useState } from 'react';
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
  const { sendMessage, isResponseLoading } = useChat();
  const [selectedPool, setSelectedPool] = useState<LendingYieldsPoolData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const isSendingRef = React.useRef(false);

  useEffect(() => {
    if (!body) return;
    const allPools = body || [];
    if (allPools.length > 0) {
      sessionStorage.setItem(SOLANA_LENDING_POOL_DATA_STORAGE_KEY, JSON.stringify(allPools));
    }
  }, [body]);

  const handleLendClick = async (poolData: LendingYieldsPoolData) => {
    if (isResponseLoading || isDisabled || isSendingRef.current) return;

    // Prevent subsequent clicks from firing duplicate chat requests until the response finishes
    isSendingRef.current = true;
    setIsDisabled(true);

    const symbol = poolData?.tokenData?.symbol || poolData?.symbol;
    // Use tokenMintAddress from DefiLlama's underlyingTokens as source of truth
    const tokenAddress = poolData?.tokenMintAddress || poolData?.tokenData?.id;

    // Include token address in the message so the agent uses the correct one
    sendMessage(
      `I want to lend ${symbol} (${tokenAddress}) to ${capitalizeWords(poolData.project)}`,
    );
  };

  const handleMoreDetailsClick = (poolData: LendingYieldsPoolData, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the lend click

    // Keep cards disabled while modal is open to avoid stray clicks sending messages
    setIsDisabled(true);
    setSelectedPool(poolData);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isResponseLoading) {
      setIsDisabled(true);
      return;
    }

    // Response finished; allow another selection after a short delay
    setTimeout(() => {
      isSendingRef.current = false;
      setIsDisabled(false);
    }, 300);
  }, [isResponseLoading]);

  return (
    <>
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

      {/* Modal */}
      <PoolDetailsModal
        pool={selectedPool}
        isOpen={isModalOpen}
        variant="lending"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPool(null);
          // Re-enable cards shortly after closing modal
          setTimeout(() => {
            isSendingRef.current = false;
            setIsDisabled(false);
          }, 300);
        }}
      />
    </>
  );
};

export default LendingYieldsTool;
