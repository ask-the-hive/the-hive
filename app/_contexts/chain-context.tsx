'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
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
  const { wallets, ready: walletsReady } = useWallets();
  
  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());

  // Debug logging
  useEffect(() => {
    console.log("Chain context state:", {
      currentChain,
      walletAddresses,
      solanaWallets: solanaWallets.map(w => ({ address: w.address })),
      evmWallets: wallets.filter(w => w.address.startsWith('0x')).map(w => ({ address: w.address }))
    });
  }, [currentChain, walletAddresses, solanaWallets, wallets]);

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
        console.log(`Setting ${chain} address:`, address);
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
    console.log("Setting current chain to:", chain);
    setCurrentChainState(chain);
  }, []);

  // Get the current wallet address based on the selected chain
  const currentWalletAddress = walletAddresses[currentChain];

  // Check for Solana wallets from the hook - only run once per wallet
  useEffect(() => {
    if (solanaWallets.length > 0) {
      console.log("Processing Solana wallets:", solanaWallets.length);
      solanaWallets.forEach(wallet => {
        if (wallet.address) {
          const key = `solana:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            console.log("Setting Solana address from useSolanaWallets:", wallet.address);
            setWalletAddress('solana', wallet.address);
          }
        }
      });
    }
  }, [solanaWallets, setWalletAddress]);

  // Check for EVM wallets from the useWallets hook
  useEffect(() => {
    if (walletsReady && wallets.length > 0) {
      console.log("Processing wallets from useWallets:", wallets.length);
      
      // Filter for EVM wallets (BSC)
      const evmWallets = wallets.filter(wallet => 
        wallet.address.startsWith('0x')
      );
      
      console.log("EVM wallets found:", evmWallets.length);
      
      evmWallets.forEach(wallet => {
        if (wallet.address) {
          const key = `bsc:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            console.log("Setting BSC address from useWallets:", wallet.address);
            setWalletAddress('bsc', wallet.address);
          }
        }
      });
    }
  }, [wallets, walletsReady, setWalletAddress]);

  // Initialize wallet addresses when user connects or links new wallets
  useEffect(() => {
    if (!user) return;
    
    console.log("Chain context: Processing user wallet info", {
      mainWallet: user.wallet?.address,
      walletType: user.wallet?.walletClientType,
      linkedAccounts: user.linkedAccounts?.length
    });
    
    // Process main wallet
    if (user.wallet?.address) {
      // Determine if the address is a Solana address (base58) or BSC address (0x...)
      const isSolanaAddress = user.wallet.walletClientType === 'solana' || 
                             !user.wallet.address.startsWith('0x');
      
      if (isSolanaAddress) {
        console.log("Setting Solana address from main wallet:", user.wallet.address);
        setWalletAddress('solana', user.wallet.address);
      } else {
        console.log("Setting BSC address from main wallet:", user.wallet.address);
        setWalletAddress('bsc', user.wallet.address);
      }
    }
    
    // Check for linked accounts
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      user.linkedAccounts.forEach(account => {
        if (account.type === 'wallet') {
          const walletAccount = account as any; // Type assertion to access address
          if (walletAccount.address) {
            const isSolanaWallet = walletAccount.walletClientType === 'solana' || 
                                  !walletAccount.address.startsWith('0x');
            
            if (isSolanaWallet) {
              console.log("Setting Solana address from linked account:", walletAccount.address);
              setWalletAddress('solana', walletAccount.address);
            } else {
              console.log("Setting BSC address from linked account:", walletAccount.address);
              setWalletAddress('bsc', walletAccount.address);
            }
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