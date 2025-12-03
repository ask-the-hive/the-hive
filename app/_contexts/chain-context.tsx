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
import { usePrivy, useConnectWallet, useLinkAccount } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  Button,
} from '@/components/ui';
import { PublicKey } from '@solana/web3.js';
import { clearUserDataCache } from '@/lib/swr-cache';

// Extend Window interface for Phantom wallet
declare global {
  interface Window {
    solana?: {
      publicKey: PublicKey | null;
      isConnected: boolean;
      on: (event: string, callback: (publicKey: PublicKey | null) => void) => void;
      removeListener?: (event: string, callback: (publicKey: PublicKey | null) => void) => void;
      isPhantom?: boolean;
    };
  }
}

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
  setLastVerifiedSolanaWallet: () => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

// Use a module-level variable to persist the chain selection across renders
let persistedChain: ChainType = 'solana';

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with the persisted chain
  const [currentChain, setCurrentChainState] = useState<ChainType>(persistedChain);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const [showEvmWarningModal, setShowEvmWarningModal] = useState(false);
  const { user, logout } = usePrivy();
  const router = useRouter();

  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());

  // Track wallet connections via the useConnectWallet hook - this gives us the exact wallet that was connected
  useConnectWallet({
    onSuccess: (wallet) => {
      console.log('Wallet connected:', wallet.address);
      // Update the wallet address based on the wallet type
      if (wallet.type === 'solana') {
        setWalletAddresses((prev) => ({
          ...prev,
          solana: wallet.address,
        }));
        setCurrentChainState('solana');
      } else if (wallet.type === 'ethereum') {
        console.log('EVM wallet connected, but app is Solana-only:', wallet.address);
        setShowEvmWarningModal(true);
      }
    },
    onError: (error) => {
      // Ignore user cancellation errors
      const errorStr = String(error);
      if (errorStr.includes('exited')) return;

      console.error('Error connecting wallet:', error);
      Sentry.captureException(error);
    },
  });

  // Track wallet linking (when user adds a wallet to their existing account)
  useLinkAccount({
    onSuccess: (user, linkMethod, linkedAccount) => {
      // Check if the linked account is a wallet
      if (linkedAccount.type === 'wallet') {
        const walletAccount = linkedAccount as any;
        console.log('Wallet linked to account:', walletAccount.address);

        // Update wallet address if it's a Solana wallet
        if (walletAccount.chainType === 'solana' || !walletAccount.address?.startsWith('0x')) {
          setWalletAddresses((prev) => ({
            ...prev,
            solana: walletAccount.address,
          }));
          setCurrentChainState('solana');
        } else {
          console.log('EVM wallet linked, but app is Solana-only:', walletAccount.address);
          setShowEvmWarningModal(true);
        }
      }
    },
    onError: (error) => {
      // Ignore user cancellation errors (e.g. "exited_link_flow")
      const errorStr = String(error);
      if (errorStr.includes('exited')) return;

      console.error('Error linking account:', error);
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

  const setLastVerifiedSolanaWallet = useCallback(() => {
    // First, check if solana has a currently connected wallet
    if (typeof window !== 'undefined' && window.solana?.publicKey && window.solana?.isConnected) {
      const currentPhantomAddress = window.solana.publicKey.toString();
      console.log('Using current Phantom wallet:', currentPhantomAddress);

      setWalletAddresses((prev) => ({
        ...prev,
        solana: currentPhantomAddress,
      }));
      return;
    }

    // Fallback: If wallet provider doesn't have an active wallet, use Privy's linked accounts
    const solanaWalletAccounts = user?.linkedAccounts
      ?.filter((account: any) => account.type === 'wallet' && account.chainType === 'solana')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.latestVerifiedAt).getTime();
        const dateB = new Date(b.latestVerifiedAt).getTime();
        return dateB - dateA; // Sort descending (most recent first)
      });

    if (solanaWalletAccounts && solanaWalletAccounts.length > 0) {
      // Use the most recently verified Solana wallet as fallback
      const fallbackWallet = solanaWalletAccounts[0] as any;

      setWalletAddresses((prev) => ({
        ...prev,
        solana: fallbackWallet.address,
      }));
    }
  }, [user]);

  // Initialize wallet address from user's linked accounts on app load/refresh
  // Prioritize window.solana.publicKey as the most reliable source of truth
  useEffect(() => {
    if (!user) return;
    if (walletAddresses.solana) return;

    setLastVerifiedSolanaWallet();
  }, [user, walletAddresses.solana, setLastVerifiedSolanaWallet]);

  const handleDisconnect = useCallback(async () => {
    // Check if user has other authentication methods (email, social, etc.)
    const hasNonWalletAuth = user?.linkedAccounts?.some(
      (account: any) => account.type !== 'wallet',
    );

    if (hasNonWalletAuth) {
      // User logged in with email/social - just clear the wallet address
      setWalletAddresses((prev) => ({
        ...prev,
        solana: undefined,
      }));
    } else {
      // wallet provider is their only auth method - log them out completely
      clearUserDataCache();
      await logout();
      router.push('/chat');
    }
  }, [user, logout, router]);

  // Handle wallet provider account switching
  // When a user switches accounts in wallet provider, update our wallet address
  useEffect(() => {
    if (typeof window === 'undefined' || !window?.solana?.on) return;

    const handleAccountChanged = async (publicKey: PublicKey | null) => {
      if (publicKey) {
        const newAddress = publicKey.toString();
        console.log('wallet provider account changed to:', newAddress);

        // Update the wallet address in our context
        setWalletAddresses((prev) => ({
          ...prev,
          solana: newAddress,
        }));
      } else {
        await handleDisconnect();
      }
    };

    window.solana.on('accountChanged', handleAccountChanged);

    return () => {
      if (window?.solana?.removeListener) {
        window.solana.removeListener('accountChanged', handleAccountChanged);
      }
    };
  }, [handleDisconnect]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window?.solana?.on) return;

    window.solana.on('disconnect', handleDisconnect);

    return () => {
      if (window?.solana?.removeListener) {
        window.solana.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleDisconnect]);

  return (
    <ChainContext.Provider
      value={{
        currentChain,
        setCurrentChain,
        walletAddresses,
        setWalletAddress,
        currentWalletAddress,
        setLastVerifiedSolanaWallet,
      }}
    >
      {children}

      {/* EVM Wallet Warning Modal */}
      <AlertDialog open={showEvmWarningModal} onOpenChange={setShowEvmWarningModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>EVM Wallets Not Supported</AlertDialogTitle>
            <AlertDialogDescription>
              This application currently only supports Solana wallets. Please connect a Solana
              wallet (such as Phantom, Solflare, or Backpack) to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowEvmWarningModal(false)}
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
