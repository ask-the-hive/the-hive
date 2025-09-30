'use client';

import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Swap from '@/app/_components/swap';
import { Token } from '@/db/types';
import { useChain } from '@/app/_contexts/chain-context';
import SwapSuccessModal from '../_components/swap-success-modal';

interface SwapModalContextType {
  isOpen: boolean;
  mode: 'buy' | 'sell';
  tokenAddress: string;
  onOpen: (mode: 'buy' | 'sell', tokenAddress: string, handleSuccess?: () => void) => void;
  onClose: () => void;
  setSwapResult?: (result: { outputAmount: string; outputToken: string }) => void;
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
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [tokenAddress, setTokenAddress] = useState('');
  const [token, setToken] = useState<Token | null>(null);
  const [handleSuccess, setHandleSuccess] = useState<(() => void) | undefined>(undefined);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [swapSuccessData, setSwapSuccessData] = useState<{
    mode: 'buy' | 'sell';
    inputToken: string;
    outputToken: string;
    outputAmount: string;
  } | null>(null);
  const [swapResult, setSwapResult] = useState<{
    outputAmount: string;
    outputToken: string;
  } | null>(null);
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
  ) => {
    // First clear existing states
    setToken(null);
    setHandleSuccess(newHandleSuccess);

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
    setTokenAddress('');
    setHandleSuccess(undefined);
  };

  const onSuccess = (txHash: string) => {
    // Create swap success data
    const inputToken =
      mode === 'buy'
        ? currentChain === 'solana'
          ? 'SOL'
          : currentChain === 'base'
            ? 'ETH'
            : 'BNB'
        : token?.symbol || '';
    const outputToken =
      mode === 'buy'
        ? token?.symbol || ''
        : currentChain === 'solana'
          ? 'SOL'
          : currentChain === 'base'
            ? 'ETH'
            : 'BNB';

    setSwapSuccessData({
      mode,
      inputToken,
      outputToken,
      outputAmount: swapResult?.outputAmount || 'N/A',
    });

    // Close swap modal and show success modal
    onClose();
    setIsSuccessModalOpen(true);

    // Call the original success handler to refresh portfolio
    handleSuccess?.();
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setSwapSuccessData(null);
  };

  const onError = (error: string) => {
    console.error('Swap error:', error);
  };

  // Define chain-specific priority tokens
  const priorityTokens =
    currentChain === 'base'
      ? [
          '0x4200000000000000000000000000000000000006', // WETH
          '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDC
          '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
        ]
      : currentChain === 'bsc'
        ? [
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            '0x55d398326f99059fF775485246999027B3197955', // USDT
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
          ]
        : [
            'So11111111111111111111111111111111111111112', // SOL
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
          ];

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
            <DialogTitle>{mode === 'buy' ? 'Buy' : 'Sell'}</DialogTitle>
          </DialogHeader>
          <Swap
            initialInputToken={mode === 'buy' ? null : token}
            initialOutputToken={mode === 'buy' ? token : null}
            inputLabel={mode === 'buy' ? 'Pay with' : 'Sell'}
            outputLabel={mode === 'buy' ? 'Buy' : 'Receive'}
            onSuccess={onSuccess}
            onError={onError}
            priorityTokens={priorityTokens}
            setSwapResult={setSwapResult}
          />
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <SwapSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        swapData={swapSuccessData}
      />
    </SwapModalContext.Provider>
  );
};

export default SwapModalProvider;
