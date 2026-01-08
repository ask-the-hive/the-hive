'use client';

import { Connection, VersionedTransaction } from '@solana/web3.js';

import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { usePrivy, useWallets } from '@privy-io/react-auth';

import { useChain } from '@/app/_contexts/chain-context';

export const useSendTransaction = () => {
  const { wallets: solanaWallets } = useSolanaWallets();
  const { wallets: allWallets } = useWallets();
  const { user } = usePrivy();

  const { currentChain } = useChain();

  // For Solana chain, find a Solana wallet from multiple sources
  let wallet: any = null;

  if (currentChain === 'solana') {
    const windowPhantomAddress =
      typeof window !== 'undefined' && (window as any).solana?.publicKey
        ? String((window as any).solana.publicKey)
        : null;

    const isSolanaAddress = (address?: string) => !!address && !address.startsWith('0x');
    const isEmbeddedPrivyWallet = (w: any) => w?.walletClientType === 'privy';
    const isExternalWallet = (w: any) => isSolanaAddress(w?.address) && !isEmbeddedPrivyWallet(w);

    // Try useSolanaWallets first (new API) - for external wallets
    if (solanaWallets.length > 0) {
      if (windowPhantomAddress) {
        wallet = solanaWallets.find((w: any) => w?.address === windowPhantomAddress) ?? null;
      }
      if (!wallet) {
        wallet = solanaWallets.find(isExternalWallet) ?? null;
      }
      if (!wallet) {
        wallet = solanaWallets[0];
      }
    }
    // Try linkedAccounts for embedded or linked Solana wallets
    else if (user?.linkedAccounts) {
      const solanaAccounts = user.linkedAccounts.filter(
        (account: any) => account.type === 'wallet' && account.chainType === 'solana',
      );

      if (windowPhantomAddress) {
        wallet = solanaAccounts.find((w: any) => w?.address === windowPhantomAddress) ?? null;
      }

      if (!wallet) {
        wallet = solanaAccounts.find(isExternalWallet) ?? null;
      }

      if (!wallet) {
        wallet =
          solanaAccounts.find(
            (account: any) => account.walletClientType === 'privy' && isSolanaAddress(account.address),
          ) ?? null;
      }
    }
    // Fallback to allWallets (look for non-0x addresses or phantom)
    if (!wallet && allWallets.length > 0) {
      if (windowPhantomAddress) {
        wallet = allWallets.find((w: any) => w?.address === windowPhantomAddress) ?? null;
      }
      if (!wallet) {
        wallet = allWallets.find(isExternalWallet) ?? null;
      }
      if (!wallet) {
        wallet = allWallets.find((w: any) => isSolanaAddress(w?.address)) ?? null;
      }
    }
    // Last resort: use user.wallet if it's a Solana wallet
    if (!wallet && user?.wallet && !user.wallet.address.startsWith('0x')) {
      wallet = user.wallet;
    }

    if (!wallet && windowPhantomAddress) {
      wallet = { address: windowPhantomAddress, walletClientType: 'phantom' };
    }
  }

  // For external wallets, also check if window.solana is actually connected
  // This ensures we don't show the UI as "connected" if the browser wallet isn't active
  if (
    wallet &&
    (wallet.walletClientType === 'phantom' || wallet.connectorType === 'solana_adapter')
  ) {
    const isWindowSolanaConnected =
      typeof window !== 'undefined' && (window as any).solana?.isConnected === true;

    // If window.solana is not connected, treat the wallet as not available
    // This will show the "Connect Wallet" button which will re-establish the connection
    if (!isWindowSolanaConnected) {
      wallet = null;
    }
  }

  const sendTransaction = async (transaction: VersionedTransaction) => {
    if (!wallet) throw new Error('No Solana wallet found');

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

    // If the wallet has a sendTransaction method, use it directly
    if (typeof (wallet as any).sendTransaction === 'function') {
      return wallet.sendTransaction(transaction, connection, {
        skipPreflight: true,
      });
    }

    // For external wallets (Phantom, Solflare, etc.) connected via solana_adapter,
    // we need to use the wallet adapter from the window object
    if (wallet.walletClientType === 'phantom' || wallet.connectorType === 'solana_adapter') {
      // Check if window.solana (Phantom) is available and has the required methods
      if (
        typeof window !== 'undefined' &&
        (window as any).solana &&
        typeof (window as any).solana.signAndSendTransaction === 'function'
      ) {
        const phantomWallet = (window as any).solana;

        // Check if wallet is connected
        if (!phantomWallet.isConnected) {
          try {
            await phantomWallet.connect();
          } catch (error) {
            throw new Error('Failed to connect to wallet: ' + (error as Error).message);
          }
        }

        try {
          const signature = await phantomWallet.signAndSendTransaction(transaction);
          return signature.signature || signature;
        } catch (error) {
          throw new Error('Failed to send transaction: ' + (error as Error).message);
        }
      } else {
        throw new Error('Phantom wallet not found or does not support signAndSendTransaction');
      }
    }

    // If we get here, we don't know how to send with this wallet type
    throw new Error(
      `Unable to send transaction: wallet type '${wallet.walletClientType}' with connector '${wallet.connectorType}' does not have a sendTransaction method and no fallback is available`,
    );
  };

  return {
    sendTransaction,
    wallet,
  };
};
