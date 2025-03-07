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

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChain, setCurrentChain] = useState<ChainType>('solana');
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const { user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  
  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);

  // Debug function to log all wallets
  const logAllWallets = useCallback(() => {
    console.log("=== WALLET DEBUG INFO ===");
    console.log("Current chain:", currentChain);
    console.log("Wallet addresses:", walletAddresses);
    console.log("User wallet:", user?.wallet);
    console.log("Linked accounts:", user?.linkedAccounts);
    console.log("Solana wallets:", solanaWallets);
    console.log("========================");
  }, [currentChain, walletAddresses, user, solanaWallets]);

  // Set wallet address for a specific chain
  const setWalletAddress = useCallback((chain: ChainType, address: string) => {
    // Check if we've already processed this address to prevent loops
    const key = `${chain}:${address}`;
    if (processedWallets.current.has(key)) {
      return;
    }
    
    console.log(`Setting ${chain} wallet address:`, address);
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

  // Get the current wallet address based on the selected chain
  const currentWalletAddress = walletAddresses[currentChain];

  // Check for Solana wallets from the hook - only run once per wallet
  useEffect(() => {
    if (solanaWallets.length > 0) {
      solanaWallets.forEach(wallet => {
        if (wallet.address) {
          const key = `solana:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            console.log("Setting Solana wallet from hook:", wallet.address);
            setWalletAddress('solana', wallet.address);
          }
        }
      });
    }
  }, [solanaWallets, setWalletAddress]);

  // Initialize wallet addresses when user connects or links new wallets
  useEffect(() => {
    if (!user) return;
    
    // Only log on initial mount or when user changes
    if (isInitialMount.current) {
      console.log("User updated, checking wallets:", user);
      logAllWallets();
      isInitialMount.current = false;
    }
    
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
  }, [user, setWalletAddress, logAllWallets]);

  // When switching chains, log the current state
  useEffect(() => {
    if (currentChain && !walletAddresses[currentChain]) {
      console.log(`No wallet connected for ${currentChain}`);
    } else if (currentChain && walletAddresses[currentChain]) {
      console.log(`Using ${currentChain} wallet:`, walletAddresses[currentChain]);
    }
  }, [currentChain, walletAddresses]);

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