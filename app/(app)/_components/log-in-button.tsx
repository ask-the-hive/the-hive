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
        '!bg-gradient-to-r !from-[#d3a32d] !to-[#b67617]',
        'dark:!from-[#d3a32d] dark:!to-[#b67617]',
        '!text-neutral-50 !font-medium',
        '!border-0',
        'shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)]',
        'dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]',
        'hover:shadow-[0_3px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]',
        'dark:hover:shadow-[0_3px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]',
        'before:absolute before:inset-0 before:pointer-events-none before:z-0 before:rounded-full',
        'before:bg-[linear-gradient(135deg,transparent_0%,transparent_40%,rgba(255,255,255,0.12)_48%,rgba(255,255,255,0.14)_50%,rgba(255,255,255,0.12)_52%,transparent_60%,transparent_100%)]',
        'before:translate-x-[-100%] before:translate-y-[-100%] before:rotate-45',
        'hover:before:animate-premium-shimmer',
        '[&>*]:relative [&>*]:z-10',
        className
      )}
    >
      Connect Wallet
    </Button>
  );
};

export default LogInButton;
