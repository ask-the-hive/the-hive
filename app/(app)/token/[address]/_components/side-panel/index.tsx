'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeftRight, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui';

import Swap from '@/app/_components/swap';
import Chat from './chat';
import { ChatProvider } from '../../_contexts';
import { useChain } from '@/app/_contexts/chain-context';
import { ChainType } from '@/app/_contexts/chain-context';
import { WBNB_METADATA } from '@/lib/config/bsc';
import { WETH_METADATA } from '@/lib/config/base';
import SwapSuccessModal from '@/app/(app)/portfolio/[address]/_components/swap-success-modal';
import SwapFailedModal from '@/app/(app)/portfolio/[address]/_components/swap-failed-modal';

import type { TokenChatData } from '@/types';
import type { Token } from '@/db/types';
import { useIsMobile } from '@/hooks/utils/use-mobile';
import { toUserFacingErrorTextWithContext } from '@/lib/user-facing-error';

// SOL token metadata
const SOL_METADATA: Token = {
  id: 'So11111111111111111111111111111111111111112',
  name: 'Solana',
  symbol: 'SOL',
  decimals: 9,
  tags: [],
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  freezeAuthority: null,
  mintAuthority: null,
  permanentDelegate: null,
  extensions: {},
};

interface Props {
  address: string;
}

const SidePanel: React.FC<Props> = ({ address }) => {
  const { currentChain } = useChain();
  const searchParams = useSearchParams();
  const chainParam = searchParams.get('chain') as ChainType | null;

  // Use URL param if available, otherwise use context
  const chain =
    chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base')
      ? chainParam
      : currentChain;

  const [tokenData, setTokenData] = useState<Token | null>(null);
  const [tokenChatData, setTokenChatData] = useState<TokenChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Swap modal state
  const [swapSuccessModalOpen, setSwapSuccessModalOpen] = useState(false);
  const [swapFailedModalOpen, setSwapFailedModalOpen] = useState(false);
  const [swapSuccessData, setSwapSuccessData] = useState<{
    mode: 'buy' | 'sell' | 'withdraw';
    inputToken: string;
    outputToken: string;
    outputAmount: string;
  } | null>(null);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [swapFailedData, setSwapFailedData] = useState<{
    mode: 'buy' | 'sell';
    inputToken: string;
    outputToken: string;
    error?: string;
  } | null>(null);

  const isMobile = useIsMobile();

  // Get the initial sell token based on chain
  const initialSellToken =
    chain === 'bsc' ? WBNB_METADATA : chain === 'base' ? WETH_METADATA : SOL_METADATA;

  useEffect(() => {
    const fetchTokenData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/token/${address}/data?chain=${chain}`);

        if (!response.ok) {
          throw new Error('Failed to fetch token data');
        }

        const data = await response.json();

        setTokenData(data);

        // Set token chat data
        if (data.overview) {
          setTokenChatData({
            address: data.id,
            name: data.name,
            symbol: data.symbol,
            decimals: data.decimals,
            extensions: data.extensions,
            logoURI: data.logoURI,
            supply: data.overview.supply,
            circulatingSupply: data.overview.circulatingSupply,
            chain,
          });
        } else {
          setTokenChatData({
            address: data.id,
            name: data.name,
            symbol: data.symbol,
            decimals: data.decimals,
            extensions: data.extensions,
            logoURI: data.logoURI,
            supply: 0,
            circulatingSupply: 0,
            chain,
          });
        }
      } catch (error) {
        console.error(error);
        setError(toUserFacingErrorTextWithContext("Couldn't load token data right now.", error));
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [address, chain]);

  // Swap handlers
  const handleSwapSuccess = (txHash: string) => {
    setSuccessTxHash(txHash);
    setSwapSuccessData({
      mode: 'buy', // User is buying the token
      inputToken: initialSellToken.symbol,
      outputToken: tokenData?.symbol || '',
      outputAmount: '', // Could be extracted from transaction if needed
    });
    setSwapSuccessModalOpen(true);
  };

  const handleSwapError = (errorMessage: string) => {
    setSwapFailedData({
      mode: 'buy',
      inputToken: initialSellToken.symbol,
      outputToken: tokenData?.symbol || '',
      error: errorMessage,
    });
    setSwapFailedModalOpen(true);
  };

  const handleSwapCancel = () => {
    // For cancel, we can show the failed modal with a cancelled message
    setSwapFailedData({
      mode: 'buy',
      inputToken: initialSellToken.symbol,
      outputToken: tokenData?.symbol || '',
      error: 'Transaction was cancelled',
    });
    setSwapFailedModalOpen(true);
  };

  const closeSwapSuccessModal = () => {
    setSwapSuccessModalOpen(false);
    setSwapSuccessData(null);
    setSuccessTxHash(null);
  };

  const closeSwapFailedModal = () => {
    setSwapFailedModalOpen(false);
    setSwapFailedData(null);
  };

  if (loading) {
    return (
      <div className="h-full w-full p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[calc(100%-40px)] w-full" />
      </div>
    );
  }

  if (error || !tokenData || !tokenChatData) {
    return (
      <div className="h-full w-full p-4 text-center">
        <p className="text-red-500">Error loading token data</p>
      </div>
    );
  }

  return (
    <Tabs
      className={
        isMobile
          ? 'flex flex-col items-start w-full max-w-full'
          : 'h-full flex flex-col items-start w-full max-w-full'
      }
      defaultValue="chat"
    >
      <TabsList className="p-0 h-[44px] justify-start bg-neutral-100 dark:bg-neutral-700 w-full max-w-full overflow-x-auto rounded-none no-scrollbar">
        <TabsTrigger value="chat" className="h-full">
          <MessageSquare className="w-4 h-4" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="trade" className="h-full">
          <ArrowLeftRight className="w-4 h-4" />
          Trade
        </TabsTrigger>
      </TabsList>
      <div
        className={
          isMobile ? 'w-full no-scrollbar' : 'flex-1 h-0 overflow-y-auto w-full no-scrollbar'
        }
      >
        <TabsContent value="chat" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
          <ChatProvider token={tokenChatData}>
            <Chat token={tokenChatData} />
          </ChatProvider>
        </TabsContent>
        <TabsContent value="trade" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
          <Swap
            initialInputToken={initialSellToken}
            initialOutputToken={tokenData}
            inputLabel="Sell"
            outputLabel="Buy"
            className="w-full"
            eventName="swap"
            onSuccess={handleSwapSuccess}
            onError={handleSwapError}
            onCancel={handleSwapCancel}
          />
        </TabsContent>
      </div>

      {/* Swap Status Modals */}
      {swapSuccessData && (
        <SwapSuccessModal
          isOpen={swapSuccessModalOpen}
          onClose={closeSwapSuccessModal}
          swapData={swapSuccessData}
          txHash={successTxHash || undefined}
          chain={chain}
        />
      )}
      <SwapFailedModal
        isOpen={swapFailedModalOpen}
        onClose={closeSwapFailedModal}
        swapData={swapFailedData}
      />
    </Tabs>
  );
};

export default SidePanel;
