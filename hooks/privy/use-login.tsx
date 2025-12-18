'use client';

import {
  useConnectWallet,
  usePrivy,
  useLogin as usePrivyLogin,
  Wallet,
  useWallets,
} from '@privy-io/react-auth';
import { useFundWallet, useSolanaWallets } from '@privy-io/react-auth/solana';
import { useChain } from '@/app/_contexts/chain-context';
import { useRouter } from 'next/navigation';
import { clearUserDataCache, disconnectExternalWallets } from '@/lib/swr-cache';
import posthog from 'posthog-js';

export const useLogin = ({
  onComplete,
  onError,
}: {
  onComplete?: (wallet: Wallet) => void;
  onError?: (error: any) => void;
} = {}) => {
  const router = useRouter();
  const { user, ready, logout, linkWallet: privyLinkWallet, isModalOpen } = usePrivy();
  const { currentChain, setCurrentChain, setLastVerifiedSolanaWallet } = useChain();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const evmWallets = wallets.filter((wallet) => wallet.address.startsWith('0x'));

  const { login } = usePrivyLogin({
    onComplete: async (user) => {
      setLastVerifiedSolanaWallet();
      posthog.identify(user.id);
      posthog.capture('user_logged_in', {
        user_id: user.id,
      });
      if (user.wallet) {
        onComplete?.(user.wallet);
      }
    },
    onError: (error) => {
      if (!error?.includes('exited_auth_flow')) {
        onError?.(error);
      }
    },
  });

  const enhancedLogin = () => {
    if (currentChain === 'solana') {
      setCurrentChain('solana');
      login();
    } else {
      login();
    }
  };

  const enhancedLinkWallet = () => {
    if (currentChain === 'solana') {
      setCurrentChain('solana');
      privyLinkWallet();
    } else {
      privyLinkWallet();
    }
  };

  const fundBscWallet = (address: string) => {
    window.open(
      `https://www.binance.com/en/how-to-buy/bnb?ref=HDFG54&walletAddress=${address}`,
      '_blank',
    );
  };

  const fundBaseWallet = (address: string) => {
    window.open(`https://bridge.base.org/deposit?destinationAddress=${address}`, '_blank');
  };

  const { connectWallet } = useConnectWallet({
    onSuccess: (wallet) => {
      posthog.identify(wallet.address);
      posthog.capture('wallet_connected', {
        wallet_address: wallet.address,
      });
    },
  });

  const { fundWallet } = useFundWallet();

  const enhancedLogout = async () => {
    clearUserDataCache();
    disconnectExternalWallets();
    posthog.capture('user_logged_out', {
      user_id: user?.id,
    });
    await logout();
    router.push('/chat');
  };

  return {
    user,
    ready,
    isPrivyModalOpen: isModalOpen,
    login: enhancedLogin,
    connectWallet,
    logout: enhancedLogout,
    wallets,
    solanaWallets,
    evmWallets,
    fundWallet,
    fundBscWallet,
    fundBaseWallet,
    linkWallet: enhancedLinkWallet,
  };
};
