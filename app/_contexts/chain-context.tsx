'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { usePrivy, useConnectWallet } from '@privy-io/react-auth';
import * as Sentry from '@sentry/nextjs';

export type ChainType = 'solana' | 'bsc' | 'base';

interface WalletAddresses {
  solana?: string;
  bsc?: string;
  base?: string;
}

interface ChainContextType {
  currentChain: ChainType;
  setCurrentChain: (chain: ChainType) => void;
  walletAddresses: WalletAddresses;
  setWalletAddress: (chain: ChainType, address: string) => void;
  currentWalletAddress: string | undefined;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

// Use a module-level variable to persist the chain selection across renders
let persistedChain: ChainType = 'solana';

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with the persisted chain
  const [currentChain, setCurrentChainState] = useState<ChainType>(persistedChain);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const { user } = usePrivy();

  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());

  // Track wallet connections via the useConnectWallet hook - this gives us the exact wallet that was connected
  useConnectWallet({
    onSuccess: (wallet) => {
      // Update the wallet address based on the wallet type
      if (wallet.type === 'solana') {
        setWalletAddresses((prev) => ({
          ...prev,
          solana: wallet.address,
        }));
        setCurrentChainState('solana');
      } else if (wallet.type === 'ethereum') {
        // TODO: Uncomment for EVM wallet support
        console.log('EVM wallet connected, but app is Solana-only:', wallet.address);
        // setWalletAddresses((prev) => ({
        //   ...prev,
        //   bsc: wallet.address,
        //   base: wallet.address,
        // }));
      }
    },
    onError: (error) => {
      console.error('Error connecting wallet:', error);
      Sentry.captureException(error);
    },
  });

  // Set wallet address for a specific chain
  const setWalletAddress = useCallback((chain: ChainType, address: string) => {
    setWalletAddresses((prev) => {
      // Only update if the address is different
      if (prev[chain] !== address) {
        // Track that we've processed this address
        const key = `${chain}:${address}`;
        processedWallets.current.add(key);

        return {
          ...prev,
          [chain]: address,
        };
      }
      return prev;
    });
  }, []);

  // Wrap setCurrentChain to persist the value
  const setCurrentChain = useCallback((chain: ChainType) => {
    // Update the module-level variable to persist across renders
    persistedChain = chain;
    console.log('Setting current chain to:', chain);
    setCurrentChainState(chain);
  }, []);

  // Get the current wallet address based on the selected chain
  const currentWalletAddress = walletAddresses[currentChain];

  // Initialize wallet address from user's linked accounts on app load/refresh
  // Use latestVerifiedAt to determine the most recently used wallet
  useEffect(() => {
    if (!user) return;
    if (walletAddresses.solana) return;

    // Find the most recently verified Solana wallet from linkedAccounts
    const solanaWalletAccounts = user.linkedAccounts
      ?.filter((account: any) => account.type === 'wallet' && account.chainType === 'solana')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.latestVerifiedAt).getTime();
        const dateB = new Date(b.latestVerifiedAt).getTime();
        return dateB - dateA; // Sort descending (most recent first)
      });

    if (solanaWalletAccounts && solanaWalletAccounts.length > 0) {
      const mostRecentWallet = solanaWalletAccounts[0] as any;

      setWalletAddresses((prev) => ({
        ...prev,
        solana: mostRecentWallet.address,
      }));
    }
  }, [user, walletAddresses.solana]);

  // TODO: Add EVM wallet support (BSC/Base)
  // When re-enabling, use the same approach as Solana above:
  // Filter user.linkedAccounts for chainType === 'ethereum' (or addresses starting with 0x)
  // Sort by latestVerifiedAt descending to get the most recently used EVM wallet

  // NOTE: Wallet initialization is handled by the useEffect above using linkedAccounts.latestVerifiedAt
  // This approach is reliable because latestVerifiedAt tells us which wallet was most recently used

  return (
    <ChainContext.Provider
      value={{
        currentChain,
        setCurrentChain,
        walletAddresses,
        setWalletAddress,
        currentWalletAddress,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = (): ChainContextType => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};
