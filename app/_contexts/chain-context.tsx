'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';

export type ChainType = 'solana' | 'bsc';

interface WalletAddresses {
  solana?: string;
  bsc?: string;
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
  const { wallets: solanaWallets } = useSolanaWallets();
  
  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);

  // Set wallet address for a specific chain
  const setWalletAddress = useCallback((chain: ChainType, address: string) => {
    // Check if we've already processed this address to prevent loops
    const key = `${chain}:${address}`;
    if (processedWallets.current.has(key)) {
      return;
    }
    
    processedWallets.current.add(key);
    
    setWalletAddresses(prev => {
      // Only update if the address is different
      if (prev[chain] !== address) {
        return {
          ...prev,
          [chain]: address
        };
      }
      return prev;
    });
  }, []);

  // Wrap setCurrentChain to persist the value
  const setCurrentChain = useCallback((chain: ChainType) => {
    // Update the module-level variable to persist across renders
    persistedChain = chain;
    setCurrentChainState(chain);
  }, []);

  // Get the current wallet address based on the selected chain
  const currentWalletAddress = walletAddresses[currentChain];

  // Check for Solana wallets from the hook - only run once per wallet
  useEffect(() => {
    if (solanaWallets.length > 0) {
      solanaWallets.forEach(wallet => {
        if (wallet.address) {
          const key = `solana:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            setWalletAddress('solana', wallet.address);
          }
        }
      });
    }
  }, [solanaWallets, setWalletAddress]);

  // Initialize wallet addresses when user connects or links new wallets
  useEffect(() => {
    if (!user) return;
    
    // Process main wallet
    if (user.wallet?.address) {
      // Determine if the address is a Solana address (base58) or BSC address (0x...)
      const isSolanaAddress = user.wallet.walletClientType === 'solana' || 
                             !user.wallet.address.startsWith('0x');
      
      if (isSolanaAddress) {
        setWalletAddress('solana', user.wallet.address);
      } else {
        setWalletAddress('bsc', user.wallet.address);
      }
    }
    
    // Check for linked accounts
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      user.linkedAccounts.forEach(account => {
        if (account.type === 'wallet' && account.address) {
          const isSolanaWallet = account.walletClientType === 'solana' || 
                                !account.address.startsWith('0x');
          
          if (isSolanaWallet) {
            setWalletAddress('solana', account.address);
          } else {
            setWalletAddress('bsc', account.address);
          }
        }
      });
    }
  }, [user, setWalletAddress]);

  return (
    <ChainContext.Provider value={{ 
      currentChain, 
      setCurrentChain, 
      walletAddresses, 
      setWalletAddress,
      currentWalletAddress
    }}>
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