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
import posthog from 'posthog-js';
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
import { clearUserDataCache, disconnectExternalWallets } from '@/lib/swr-cache';

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

let persistedChain: ChainType = 'solana';

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChain, setCurrentChainState] = useState<ChainType>(persistedChain);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const [showEvmWarningModal, setShowEvmWarningModal] = useState(false);
  const { user, logout } = usePrivy();
  const router = useRouter();

  const processedWallets = useRef<Set<string>>(new Set());

  useConnectWallet({
    onSuccess: (wallet) => {
      posthog.identify(wallet.address);
      posthog.capture('wallet_connected', {
        wallet_address: wallet.address,
      });

      if (wallet.type === 'solana') {
        setWalletAddresses((prev) => ({
          ...prev,
          solana: wallet.address,
        }));
        setCurrentChainState('solana');
      } else if (wallet.type === 'ethereum') {
        setShowEvmWarningModal(true);
      }
    },
    onError: (error) => {
      const errorStr = String(error);
      if (errorStr.includes('exited')) return;

      console.error('Error connecting wallet:', error);
      Sentry.captureException(error);
    },
  });

  useLinkAccount({
    onSuccess: (user, linkMethod, linkedAccount) => {
      posthog.capture('account_linked', {
        user_id: user?.id,
        linked_account_type: linkedAccount.type,
        link_method: linkMethod,
      });
      if (linkedAccount.type === 'wallet') {
        const walletAccount = linkedAccount as any;
        if (walletAccount.chainType === 'solana' || !walletAccount.address?.startsWith('0x')) {
          setWalletAddresses((prev) => ({
            ...prev,
            solana: walletAccount.address,
          }));
          setCurrentChainState('solana');
        } else {
          setShowEvmWarningModal(true);
        }
      }
    },
    onError: (error) => {
      const errorStr = String(error);
      if (errorStr.includes('exited')) return;

      console.error('Error linking account:', error);
      Sentry.captureException(error);
    },
  });

  const setWalletAddress = useCallback((chain: ChainType, address: string) => {
    setWalletAddresses((prev) => {
      if (prev[chain] !== address) {
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

  const setCurrentChain = useCallback((chain: ChainType) => {
    persistedChain = chain;
    setCurrentChainState(chain);
  }, []);

  const currentWalletAddress = walletAddresses[currentChain];

  const setLastVerifiedSolanaWallet = useCallback(() => {
    if (typeof window !== 'undefined' && window.solana?.publicKey && window.solana?.isConnected) {
      const currentPhantomAddress = window.solana.publicKey.toString();

      setWalletAddresses((prev) => ({
        ...prev,
        solana: currentPhantomAddress,
      }));
      return;
    }

    const solanaWalletAccounts = user?.linkedAccounts
      ?.filter((account: any) => account.type === 'wallet' && account.chainType === 'solana')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.latestVerifiedAt ?? 0).getTime();
        const dateB = new Date(b.latestVerifiedAt ?? 0).getTime();
        return dateB - dateA; // Sort descending (most recent first)
      });

    if (solanaWalletAccounts && solanaWalletAccounts.length > 0) {
      const externalWallet =
        solanaWalletAccounts.find(
          (account: any) =>
            account.walletClientType !== 'privy' &&
            !!account.address &&
            !String(account.address).startsWith('0x'),
        ) ?? null;

      const fallbackWallet = (externalWallet ?? solanaWalletAccounts[0]) as any;

      setWalletAddresses((prev) => ({
        ...prev,
        solana: fallbackWallet.address,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (walletAddresses.solana) return;

    setLastVerifiedSolanaWallet();
  }, [user, walletAddresses.solana, setLastVerifiedSolanaWallet]);

  useEffect(() => {
    if (!user) return;

    const phantomConnected =
      typeof window !== 'undefined' && window.solana?.publicKey && window.solana?.isConnected;

    if (phantomConnected) {
      const phantomAddress = window.solana!.publicKey!.toString();
      if (walletAddresses.solana !== phantomAddress) {
        setWalletAddresses((prev) => ({ ...prev, solana: phantomAddress }));
      }
      return;
    }

    if (!walletAddresses.solana) return;

    const solanaAccounts =
      ((user as any)?.linkedAccounts?.filter(
        (account: any) => account.type === 'wallet' && account.chainType === 'solana',
      ) as any[]) ?? [];

    const currentAccount = solanaAccounts.find(
      (account: any) => String(account.address) === String(walletAddresses.solana),
    );

    const isCurrentEmbedded = (currentAccount as any)?.walletClientType === 'privy';
    if (!isCurrentEmbedded) return;

    const externalAccount = solanaAccounts.find((account: any) => {
      const address = account?.address;
      return account?.walletClientType !== 'privy' && !!address && !String(address).startsWith('0x');
    });

    if (externalAccount && externalAccount.address !== walletAddresses.solana) {
      setWalletAddresses((prev) => ({ ...prev, solana: externalAccount.address }));
    }
  }, [user, walletAddresses.solana]);

  const handleDisconnect = useCallback(async () => {
    posthog.capture('wallet_disconnected', {
      user_id: user?.id,
    });
    const hasNonWalletAuth = user?.linkedAccounts?.some(
      (account: any) => account.type !== 'wallet',
    );

    if (hasNonWalletAuth) {
      setWalletAddresses((prev) => ({
        ...prev,
        solana: undefined,
      }));
    } else {
      clearUserDataCache();
      disconnectExternalWallets();
      posthog.capture('user_logged_out', {
        user_id: user?.id,
      });
      await logout();
      router.push('/chat');
    }
  }, [user, logout, router]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window?.solana?.on) return;

    const handleAccountChanged = async (publicKey: PublicKey | null) => {
      if (publicKey) {
        const newAddress = publicKey.toString();

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
