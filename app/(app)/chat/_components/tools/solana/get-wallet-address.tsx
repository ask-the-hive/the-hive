import React, { useEffect, useState } from 'react';

import LoginButton from '@/app/(app)/_components/log-in-button';

import ToolCard from '../tool-card';

import { Wallet } from '@privy-io/react-auth';

import { useChat } from '@/app/(app)/chat/_contexts/chat';
import { useChain } from '@/app/_contexts/chain-context';
import { SOLANA_STAKING_POOL_DATA_STORAGE_KEY } from '@/lib/constants';

import type { ToolInvocation } from 'ai';
import type { GetWalletAddressResultType } from '@/ai';
import WalletDisplay from '@/components/ui/wallet-display';
import LockedStakingPreview from '../../locked-staking-preview';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetWalletAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
  const { messages } = useChat();

  // Check if we're in a staking flow by looking for recent staking-related tool invocations
  const isInStakingOrLendingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return (
        part.type === 'tool-invocation' &&
        (part.toolInvocation.toolName.includes(`staking-`) ||
          part.toolInvocation.toolName.includes(`lending-`))
      );
    }),
  );

  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting Solana wallet address...`}
      result={{
        heading: (result: GetWalletAddressResultType) =>
          result.body
            ? isInStakingOrLendingFlow
              ? null
              : `Fetched Solana wallet address`
            : 'No Solana wallet address found',
        body: (result: GetWalletAddressResultType) =>
          result.body ? (
            isInStakingOrLendingFlow ? null : (
              <WalletDisplay address={result.body.address} />
            )
          ) : (
            <p className="text-md font-medium text-muted-foreground">
              No Solana wallet address found
            </p>
          ),
      }}
      call={{
        heading: 'Connect Solana wallet',
        body: (toolCallId: string) => <GetWalletAddressAction toolCallId={toolCallId} />,
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const GetWalletAddressAction = ({ toolCallId }: { toolCallId: string }) => {
  const { setCurrentChain, walletAddresses } = useChain();
  const { addToolResult, isLoading, messages } = useChat();
  const [previewPool, setPreviewPool] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Set the current chain to Solana
  useEffect(() => {
    setCurrentChain('solana');
  }, [setCurrentChain]);

  // Check if we're in a staking flow
  const isInStakingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return (
        part.type === 'tool-invocation' &&
        part.toolInvocation.toolName.includes(`staking-`)
      );
    }),
  );

  // Fetch pool data for preview if in staking flow
  useEffect(() => {
    if (isInStakingFlow && typeof window !== 'undefined') {
      const storedPoolData = sessionStorage.getItem(SOLANA_STAKING_POOL_DATA_STORAGE_KEY);
      if (storedPoolData) {
        try {
          const allPools = JSON.parse(storedPoolData);
          // Get the first/best pool for preview (usually the highest yield)
          if (allPools && allPools.length > 0) {
            // Sort by yield and get the best one
            const sortedPools = [...allPools].sort((a, b) => (b.yield || 0) - (a.yield || 0));
            setPreviewPool(sortedPools[0]);
          }
        } catch (error) {
          console.error('Error parsing stored pool data:', error);
        }
      }
    }
  }, [isInStakingFlow]);

  // Check for Solana wallet address from chain context
  useEffect(() => {
    if (!isLoading && walletAddresses.solana) {
      addToolResult(toolCallId, {
        message: 'Solana Wallet connected',
        body: {
          address: walletAddresses.solana,
        },
      });
    }
  }, [walletAddresses.solana, isLoading, addToolResult, toolCallId]);

  // Detect wallet connection and trigger unlock
  useEffect(() => {
    if (walletAddresses.solana && previewPool && isInStakingFlow) {
      setIsUnlocking(true);
      setShowParticles(true);
      // Hide preview after unlock animation
      setTimeout(() => {
        setIsUnlocking(false);
        setPreviewPool(null);
        setShowParticles(false);
      }, 1500);
    }
  }, [walletAddresses.solana, previewPool, isInStakingFlow]);

  const onComplete = (wallet: Wallet) => {
    // Only use the wallet if it's a Solana wallet (not starting with 0x)
    if (!wallet.address.startsWith('0x')) {
      addToolResult(toolCallId, {
        message: 'Solana Wallet connected',
        body: {
          address: wallet.address,
        },
      });
    } else {
      // If it's not a Solana wallet, show an error
      addToolResult(toolCallId, {
        message: 'Please connect a Solana wallet (address not starting with 0x)',
        body: {
          address: '',
        },
      });
    }
  };

  const isWalletConnected = !!walletAddresses.solana;
  const showPreview = isInStakingFlow && previewPool && !isWalletConnected && !isUnlocking;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative">
        <LoginButton onComplete={onComplete} />
        {/* Particle Burst Effect */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: '50%',
                  top: '50%',
                  '--tx': `${(Math.random() - 0.5) * 100}px`,
                  '--ty': `${(Math.random() - 0.5) * 100}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>

      {/* Locked Preview */}
      {showPreview && (
        <LockedStakingPreview
          pool={{
            symbol: previewPool.symbol || previewPool.name,
            project: previewPool.project || '',
            apy: previewPool.yield || previewPool.apy || 0,
            tokenLogoURI: previewPool.tokenData?.logoURI || null,
          }}
          isUnlocking={isUnlocking}
          onClose={() => {}}
        />
      )}
    </div>
  );
};

export default GetWalletAddress;
