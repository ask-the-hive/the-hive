import { Connection, VersionedTransaction } from '@solana/web3.js';

import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';

import { useChain } from '@/app/_contexts/chain-context';

export const useSendTransaction = () => {
  const { user, sendSolanaTransaction } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { currentChain, currentWalletAddress } = useChain();

  // Debug logging
  console.log('useSendTransaction debug:', {
    currentChain,
    currentWalletAddress,
    solanaWallets: solanaWallets.map((w) => ({ address: w.address })),
    userWallet: user?.wallet?.address,
    userWalletType: user?.wallet?.walletClientType,
  });

  // For Solana chain, find the best available Solana wallet
  let wallet = null;
  let usePrivyTransaction = false;

  if (currentChain === 'solana') {
    // First try to find a Solana wallet from the useSolanaWallets hook
    if (solanaWallets.length > 0) {
      console.log('Using Solana wallet from useSolanaWallets:', solanaWallets[0].address);
      wallet = solanaWallets[0];
    }
    // Fallback to user's main wallet if it's a Solana wallet (not starting with 0x)
    else if (user?.wallet?.address && !user.wallet.address.startsWith('0x')) {
      console.log('Using main wallet as Solana wallet:', user.wallet.address);
      // Create a wallet-like object that has the address and can be used for UI purposes
      wallet = {
        address: user.wallet.address,
        // Add other properties that might be expected by the UI
        publicKey: user.wallet.address, // Solana addresses are base58 encoded public keys
      };
      usePrivyTransaction = true;
    }
  }

  console.log('useSendTransaction final wallet:', wallet ? { address: wallet.address } : null);

  const sendTransaction = async (transaction: VersionedTransaction) => {
    if (!wallet) throw new Error('No Solana wallet found');

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

    if (usePrivyTransaction) {
      // Use Privy's sendSolanaTransaction for main wallet
      return sendSolanaTransaction(transaction, connection);
    } else {
      // Use the wallet's sendTransaction method (only if it's a ConnectedSolanaWallet)
      if ('sendTransaction' in wallet) {
        return wallet.sendTransaction(transaction, connection, {
          skipPreflight: true,
        });
      } else {
        throw new Error('Wallet does not support sendTransaction');
      }
    }
  };

  return {
    sendTransaction,
    wallet,
  };
};
