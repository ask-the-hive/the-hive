'use client';

import React from 'react';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

import '@/components/utils/suppress-console';

interface Props {
  children: React.ReactNode;
}

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

export const PrivyProvider: React.FC<Props> = ({ children }) => {
  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#d19900',
          logo: '/logo.png',
          walletChainType: 'solana-only', // TODO: Change to 'all-chains' to re-enable EVM
          showWalletLoginFirst: true,
          walletList: ['phantom', 'wallet_connect', 'detected_solana_wallets'],
        },
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
        // Ensure embedded wallets (from email/social login) are Solana-only
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        // NOTE: Do not specify supportedChains for Solana-only mode
        // walletChainType: 'solana-only' already restricts to Solana
        // TODO: To re-enable EVM chains, uncomment and add chains:
        // supportedChains: [base, bsc, mainnet, etc.],
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        solanaClusters: [
          {
            name: 'mainnet-beta',
            rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
          },
        ],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
};
