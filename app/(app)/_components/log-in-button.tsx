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
        '!bg-gradient-to-r !from-amber-500 !via-yellow-400 !to-yellow-500',
        'dark:!from-amber-600 dark:!via-yellow-500 dark:!to-yellow-600',
        '!text-neutral-50 !font-medium',
        '!border !border-amber-300/50 dark:!border-amber-400/50',
        'shadow-[0_0_6px_rgba(251,191,36,0.25),0_0_12px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(251,191,36,0.2)]',
        'dark:shadow-[0_0_8px_rgba(251,191,36,0.3),0_0_16px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_24px_rgba(251,191,36,0.25)]',
        'hover:shadow-[0_0_8px_rgba(251,191,36,0.3),0_0_16px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_24px_rgba(251,191,36,0.3)]',
        'dark:hover:shadow-[0_0_10px_rgba(251,191,36,0.35),0_0_20px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_28px_rgba(251,191,36,0.35)]',
        'before:absolute before:inset-0 before:pointer-events-none before:z-0 before:rounded-full',
        'before:bg-[linear-gradient(90deg,transparent_0%,transparent_45%,rgba(255,255,255,0.6)_48%,rgba(255,255,255,0.7)_50%,rgba(255,255,255,0.6)_52%,transparent_55%,transparent_100%)]',
        'before:translate-x-[-100%] before:translate-y-[-100%] before:rotate-45',
        'hover:before:animate-honeycomb-shine',
        'after:absolute after:inset-[2px] after:pointer-events-none after:z-0 after:rounded-full',
        'after:bg-gradient-to-b after:from-amber-400/30 after:via-transparent after:to-amber-600/20',
        'dark:after:from-amber-500/40 dark:after:via-transparent dark:after:to-amber-700/30',
        '[&>*]:relative [&>*]:z-10',
        className
      )}
    >
      Connect Wallet
    </Button>
  );
};

export default LogInButton;
