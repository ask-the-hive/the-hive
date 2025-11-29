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
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearUserDataCache, disconnectExternalWallets } from '@/lib/swr-cache';

export const useLogin = ({
  onComplete,
  onError,
}: {
  onComplete?: (wallet: Wallet) => void;
  onError?: (error: any) => void;
} = {}) => {
  const router = useRouter();
  const { user, ready, logout, linkWallet: privyLinkWallet } = usePrivy();
  const { walletAddresses, currentChain, setCurrentChain } = useChain();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();

  // Filter wallets to get EVM wallets (BSC)
  const evmWallets = wallets.filter((wallet) => wallet.address.startsWith('0x'));

  // Debug logging
  useEffect(() => {
    console.log('useLogin hook state:', {
      userWallet: user?.wallet?.address,
      walletType: user?.wallet?.walletClientType,
      linkedAccounts: user?.linkedAccounts?.length,
      solanaWallets: solanaWallets.length,
      evmWallets: evmWallets.length,
      allWallets: wallets.map((w) => ({ address: w.address, type: w.walletClientType })),
      currentChain,
      walletAddresses,
    });
  }, [user, solanaWallets, evmWallets, wallets, currentChain, walletAddresses]);

  // Note: Wallet address tracking is handled by ChainContext (single source of truth)
  // ChainContext uses useSolanaWallets()[0] to track the active wallet

  const { login } = usePrivyLogin({
    onComplete: async (user) => {
      console.log('Login completed:', {
        address: user.wallet?.address,
        walletClientType: user.wallet?.walletClientType,
      });

      // Only call the user's onComplete callback
      // Wallet address tracking is handled by ChainContext
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

  // Enhanced login that handles chain-specific wallet connections
  const enhancedLogin = () => {
    // If current chain is Solana, explicitly request Solana wallet connection
    if (currentChain === 'solana') {
      console.log('Requesting Solana wallet connection');
      // For Solana, ensure chain is set to solana before connecting
      setCurrentChain('solana');
      console.log('Chain context set to Solana, now connecting wallet...');
      // Use the standard login method but ensure chain context is Solana
      login();
    } else {
      console.log('Requesting EVM wallet connection');
      // For EVM chains, use the standard login
      login();
    }
  };

  // Enhanced linkWallet that handles wallet type
  const enhancedLinkWallet = () => {
    // Use the appropriate wallet type based on current chain
    if (currentChain === 'solana') {
      console.log('Linking Solana wallet');
      // For Solana, ensure chain is set to solana before linking
      setCurrentChain('solana');
      // Use the standard linkWallet method but ensure chain context is Solana
      privyLinkWallet();
    } else {
      console.log('Linking EVM wallet');
      // For EVM chains, use the standard linkWallet
      privyLinkWallet();
    }
  };

  // Function to fund BSC wallet using Binance
  const fundBscWallet = (address: string) => {
    // Open the Binance BNB purchase page with the wallet address
    window.open(
      `https://www.binance.com/en/how-to-buy/bnb?ref=HDFG54&walletAddress=${address}`,
      '_blank',
    );
  };

  // Function to fund Base wallet
  const fundBaseWallet = (address: string) => {
    // Open the Base bridge page
    window.open(`https://bridge.base.org/deposit?destinationAddress=${address}`, '_blank');
  };

  const { connectWallet } = useConnectWallet();

  const { fundWallet } = useFundWallet();

  // Enhanced logout with redirect
  const enhancedLogout = async () => {
    // Clear all user data from SWR cache before logging out
    clearUserDataCache();
    // Disconnect external wallets (Phantom, Solflare, etc.)
    disconnectExternalWallets();
    await logout();
    router.push('/chat');
  };

  return {
    user,
    ready,
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
