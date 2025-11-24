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
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearUserDataCache, disconnectExternalWallets } from '@/lib/swr-cache';

export const useLogin = ({
  onComplete,
}: {
  onComplete?: (wallet: Wallet) => void;
} = {}) => {
  const router = useRouter();
  const { user, ready, logout, linkWallet: privyLinkWallet } = usePrivy();
  const { walletAddresses, setWalletAddress, currentChain, setCurrentChain } = useChain();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();

  // Use refs to prevent infinite loops
  const processedWallets = useRef<Set<string>>(new Set());

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

  // Monitor for changes in linked wallets - only process each wallet once
  useEffect(() => {
    if (solanaWallets.length > 0) {
      solanaWallets.forEach((wallet) => {
        if (wallet.address) {
          const key = `solana:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            console.log('Setting Solana wallet from useLogin hook:', wallet.address);
            processedWallets.current.add(key);
            setWalletAddress('solana', wallet.address);
            // Ensure chain is set to Solana when Solana wallet is detected
            setCurrentChain('solana');
          }
        }
      });
    }

    // Process EVM wallets
    if (evmWallets.length > 0) {
      evmWallets.forEach((wallet) => {
        if (wallet.address) {
          const key = `bsc:${wallet.address}`;
          if (!processedWallets.current.has(key)) {
            console.log('Setting BSC wallet from useLogin hook:', wallet.address);
            processedWallets.current.add(key);
            setWalletAddress('bsc', wallet.address);
          }
        }
      });
    }
  }, [solanaWallets, evmWallets, setWalletAddress, setCurrentChain]);

  const { login } = usePrivyLogin({
    onComplete: async (user) => {
      if (user.wallet) {
        console.log('Wallet connection completed:', {
          address: user.wallet.address,
          walletClientType: user.wallet.walletClientType,
          addressStartsWith0x: user.wallet.address.startsWith('0x'),
        });

        // Determine wallet type and store address
        // Force Phantom to always be treated as Solana
        const isSolanaWallet =
          !user.wallet.address.startsWith('0x') ||
          user.wallet.walletClientType === 'phantom' ||
          user.wallet.walletClientType === 'solana' ||
          user.wallet.walletClientType === 'phantom-solana';

        console.log('Wallet type determination:', {
          isSolanaWallet,
          addressStartsWith0x: user.wallet.address.startsWith('0x'),
          walletClientType: user.wallet.walletClientType,
        });

        if (isSolanaWallet) {
          console.log('Login completed with Solana wallet:', user.wallet.address);
          setWalletAddress('solana', user.wallet.address);
          setCurrentChain('solana');
        } else {
          console.log('Login completed with EVM wallet:', user.wallet.address);
          setWalletAddress('bsc', user.wallet.address);
          setWalletAddress('base', user.wallet.address);
          // Keep the current chain as 'solana' by default, don't auto-switch to BSC
          // setCurrentChain('bsc');
        }

        onComplete?.(user.wallet);
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
