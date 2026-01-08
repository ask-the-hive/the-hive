'use client';

import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Swap from '@/app/_components/swap';
import { Token } from '@/db/types';
import { useChain } from '@/app/_contexts/chain-context';
import SwapSuccessModal from '../_components/swap-success-modal';
import SwapFailedModal from '../_components/swap-failed-modal';

// Type definitions for swap modal states
type SwapMode = 'buy' | 'sell';

type SwapSuccessData = {
  mode: SwapMode;
  inputToken: string;
  outputToken: string;
  outputAmount: string;
};

type SwapFailedData = {
  mode: SwapMode;
  inputToken: string;
  outputToken: string;
  error?: string;
};

type SwapResult = {
  outputAmount: string;
  outputToken: string;
  inputToken: string;
};

interface SwapModalContextType {
  isOpen: boolean;
  mode: SwapMode;
  tokenAddress: string;
  onOpen: (
    mode: SwapMode,
    tokenAddress: string,
    handleSuccess?: () => void,
    defaultToNativeCurrency?: boolean,
  ) => void;
  onClose: () => void;
  setSwapResult?: (result: SwapResult) => void;
}

const SwapModalContext = createContext<SwapModalContextType>({
  isOpen: false,
  mode: 'buy',
  tokenAddress: '',
  onOpen: () => {},
  onClose: () => {},
});

export const useSwapModal = () => useContext(SwapModalContext);

export const SwapModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SwapMode>('buy');
  const [tokenAddress, setTokenAddress] = useState('');
  const [token, setToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [handleSuccess, setHandleSuccess] = useState<(() => void) | undefined>(undefined);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [swapSuccessData, setSwapSuccessData] = useState<SwapSuccessData | null>(null);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [swapFailedData, setSwapFailedData] = useState<SwapFailedData | null>(null);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const { currentChain } = useChain();

  // Define SOL token at component level for reuse
  const solToken = {
    id: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    tags: [],
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {},
  };

  // Define ETH token at component level for reuse
  const ethToken = {
    id: '0x4200000000000000000000000000000000000006',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    tags: [],
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {},
  };

  const onOpen = async (
    newMode: 'buy' | 'sell',
    newTokenAddress: string,
    newHandleSuccess?: () => void,
    defaultToNativeCurrency?: boolean,
  ) => {
    // First clear existing states
    setToken(null);
    setOutputToken(null);
    setSwapError(null);
    // Wrap the function in another function to prevent React from treating it as an updater
    setHandleSuccess(() => newHandleSuccess);

    // Set output token to native currency if requested
    if (defaultToNativeCurrency && newMode === 'sell') {
      const nativeToken =
        currentChain === 'solana' ? solToken : currentChain === 'base' ? ethToken : null;
      setOutputToken(nativeToken);
    }

    try {
      const response = await fetch(`/api/token/${newTokenAddress}/metadata?chain=${currentChain}`);
      if (!response.ok) throw new Error('Failed to fetch token metadata');

      const metadata = await response.json();

      // Special handling for SOL token (by address or symbol)
      if (
        currentChain === 'solana' &&
        (newTokenAddress === 'So11111111111111111111111111111111111111112' ||
          newTokenAddress.toLowerCase() === 'sol' ||
          metadata.symbol?.toUpperCase() === 'SOL')
      ) {
        setMode(newMode);
        setTokenAddress(solToken.id);
        setToken(solToken);
        setIsOpen(true);
        return;
      }

      // Special handling for ETH token (by address or symbol)
      if (
        currentChain === 'base' &&
        (newTokenAddress === '0x4200000000000000000000000000000000000006' ||
          newTokenAddress.toLowerCase() === 'eth' ||
          newTokenAddress.toLowerCase() === 'weth' ||
          metadata.symbol?.toUpperCase() === 'ETH')
      ) {
        setMode(newMode);
        setTokenAddress(ethToken.id);
        setToken(ethToken);
        setIsOpen(true);
        return;
      }

      const newToken = {
        id: newTokenAddress,
        name: metadata.name || 'Unknown Token',
        symbol: metadata.symbol || 'UNKNOWN',
        decimals: metadata.decimals || 0,
        logoURI: metadata.logo_uri || '',
        tags: [],
        freezeAuthority: null,
        mintAuthority: null,
        permanentDelegate: null,
        extensions: {},
      };

      // Set all states together
      setMode(newMode);
      setTokenAddress(newTokenAddress);
      setToken(newToken);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      // Special handling for SOL token by address even if metadata fetch fails
      if (
        currentChain === 'solana' &&
        (newTokenAddress === 'So11111111111111111111111111111111111111112' ||
          newTokenAddress.toLowerCase() === 'sol')
      ) {
        setMode(newMode);
        setTokenAddress(solToken.id);
        setToken(solToken);
        setIsOpen(true);
        return;
      }

      // Special handling for ETH token by address even if metadata fetch fails
      if (
        currentChain === 'base' &&
        (newTokenAddress === '0x4200000000000000000000000000000000000006' ||
          newTokenAddress.toLowerCase() === 'eth' ||
          newTokenAddress.toLowerCase() === 'weth')
      ) {
        setMode(newMode);
        setTokenAddress(ethToken.id);
        setToken(ethToken);
        setIsOpen(true);
        return;
      }
      // Use basic token info for other tokens
      setMode(newMode);
      setTokenAddress(newTokenAddress);
      setToken({
        id: newTokenAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 0,
        logoURI: '',
        tags: [],
        freezeAuthority: null,
        mintAuthority: null,
        permanentDelegate: null,
        extensions: {},
      });
      setIsOpen(true);
    }
  };

  const onClose = () => {
    setIsOpen(false);
    setToken(null);
    setOutputToken(null);
    setTokenAddress('');
    setHandleSuccess(undefined);
    setSwapError(null);
  };

  const onSuccess = () => {
    // Create swap success data
    const inputToken =
      swapResult?.inputToken ||
      (mode === 'buy'
        ? token?.symbol ||
          (currentChain === 'solana' ? 'SOL' : currentChain === 'base' ? 'ETH' : 'BNB')
        : token?.symbol || '');
    const outputToken =
      swapResult?.outputToken ||
      (mode === 'buy'
        ? token?.symbol || ''
        : currentChain === 'solana'
          ? 'SOL'
          : currentChain === 'base'
            ? 'ETH'
            : 'BNB');

    setSwapSuccessData({
      mode,
      inputToken,
      outputToken,
      outputAmount: swapResult?.outputAmount || 'N/A',
    });

    // Clear any errors
    setSwapError(null);

    // Close swap modal and show success modal
    onClose();
    setIsSuccessModalOpen(true);

    handleSuccess?.();
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setSwapSuccessData(null);
  };

  const closeFailedModal = () => {
    setIsFailedModalOpen(false);
    setSwapFailedData(null);
  };

  const onError = (error: string) => {
    // Set the error message to display inline
    setSwapError(error || 'An error occurred during the swap. Please try again.');

    console.error('Swap error:', error);
  };

  return (
    <SwapModalContext.Provider
      value={{
        isOpen,
        mode,
        tokenAddress,
        onOpen,
        onClose,
        setSwapResult,
      }}
    >
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap</DialogTitle>
          </DialogHeader>
          <Swap
            initialInputToken={mode === 'buy' ? null : token}
            initialOutputToken={mode === 'buy' ? token : outputToken}
            inputLabel={mode === 'buy' ? 'Pay with' : 'Sell'}
            outputLabel={mode === 'buy' ? 'Buy' : 'Receive'}
            eventName="swap"
            onSuccess={onSuccess}
            onError={onError}
            onCancel={onClose}
            onInputChange={() => setSwapError(null)}
            setSwapResult={setSwapResult}
          />
          {swapError && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{swapError}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {swapSuccessData && (
        <SwapSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={closeSuccessModal}
          swapData={swapSuccessData}
        />
      )}
      {/* Failed Modal */}
      <SwapFailedModal
        isOpen={isFailedModalOpen}
        onClose={closeFailedModal}
        swapData={swapFailedData}
      />
    </SwapModalContext.Provider>
  );
};

export default SwapModalProvider;
