'use client';

import React, { useEffect } from 'react';
import '@/components/utils/suppress-console';
import { Button } from '@/components/ui';
import { useLogin } from '@/hooks';
import { Wallet, useWallets } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { useChain } from '@/app/_contexts/chain-context';
import { cn } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';

interface Props {
  onComplete?: (wallet: Wallet) => void;
  className?: string;
}

const LogInButton: React.FC<Props> = ({ onComplete, className }) => {
  const { login, user, linkWallet } = useLogin({
    onComplete,
    onError: (err: any) => {
      if (!err?.includes('exited_auth_flow')) {
        Sentry.captureException(err, {
          tags: {
            component: 'LogInButton',
            action: 'login',
          },
        });
      }
    },
  });
  const { currentChain, walletAddresses } = useChain();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  // Find the appropriate wallet address based on the current chain
  const getWalletAddress = () => {
    // First check wallets from the appropriate hook based on chain
    if (currentChain === 'bsc' || currentChain === 'base') {
      // Find EVM wallets
      const evmWallets = wallets.filter((w) => w.address.startsWith('0x'));
      if (evmWallets.length > 0) {
        return evmWallets[0].address;
      }
    } else {
      // Find Solana wallets
      if (solanaWallets.length > 0) {
        return solanaWallets[0].address;
      }

      // Also check for non-EVM wallets in the main wallets array
      const nonEvmWallets = wallets.filter((w) => !w.address.startsWith('0x'));
      if (nonEvmWallets.length > 0) {
        return nonEvmWallets[0].address;
      }
    }

    // Fallback to chain context
    const contextAddress =
      currentChain === 'solana'
        ? walletAddresses.solana
        : currentChain === 'bsc'
          ? walletAddresses.bsc
          : walletAddresses.base;

    // Final fallback to user's main wallet if it matches the current chain
    if (!contextAddress && user?.wallet?.address) {
      const isUserWalletEvm = user.wallet.address.startsWith('0x');
      if (
        (currentChain === 'bsc' && isUserWalletEvm) ||
        (currentChain === 'base' && isUserWalletEvm) ||
        (currentChain === 'solana' && !isUserWalletEvm)
      ) {
        return user.wallet.address;
      }
    }

    return contextAddress;
  };

  const address = getWalletAddress();

  // Debug logging
  useEffect(() => {
    console.log('Login button state:', {
      currentChain,
      walletAddresses,
      userWallet: user?.wallet?.address,
      solanaWallets: solanaWallets.map((w) => ({ address: w.address })),
      evmWallets: wallets
        .filter((w) => w.address.startsWith('0x'))
        .map((w) => ({ address: w.address })),
      displayAddress: address,
    });
  }, [currentChain, walletAddresses, user, address, wallets, solanaWallets]);

  return (
    <Button
      variant="brand"
      onClick={() => {
        if (user) {
          linkWallet();
        } else {
          login();
        }
      }}
      className={cn(
        'w-full relative overflow-hidden',
        '!bg-gradient-to-r !from-amber-500 !via-yellow-500 !to-amber-600',
        'dark:!from-amber-600 dark:!via-yellow-600 dark:!to-amber-700',
        '!text-neutral-50',
        '!border-2 !border-amber-400/60 dark:!border-amber-400/60',
        'shadow-[0_0_20px_rgba(251,191,36,0.4),0_0_40px_rgba(245,158,11,0.2)]',
        'dark:shadow-[0_0_20px_rgba(251,191,36,0.5),0_0_40px_rgba(245,158,11,0.3)]',
        'hover:shadow-[0_0_30px_rgba(251,191,36,0.6),0_0_50px_rgba(245,158,11,0.4)]',
        'dark:hover:shadow-[0_0_30px_rgba(251,191,36,0.7),0_0_50px_rgba(245,158,11,0.5)]',
        'before:absolute before:inset-0 before:pointer-events-none',
        'before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',
        'before:translate-x-[-100%] before:translate-y-[-100%] before:rotate-45',
        'hover:before:animate-honeycomb-shine',
        className
      )}
    >
      Connect Wallet
    </Button>
  );
};

export default LogInButton;
