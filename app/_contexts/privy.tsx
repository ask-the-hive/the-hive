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

const config = {
  appearance: {
    theme: 'dark',
    accentColor: 'rgb(209 153 0)',
    logo: '/logo.png',
    walletChainType: 'solana-only',
    showWalletLoginFirst: true,
    walletList: ['phantom', 'wallet_connect', 'detected_solana_wallets'],
  },
  loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
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
};

export const PrivyProvider: React.FC<Props> = ({ children }) => {
  return (
    <PrivyProviderBase appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} config={config}>
      {children}
    </PrivyProviderBase>
  );
};
