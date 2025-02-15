"use client";

import React from 'react';

import {PrivyProvider as PrivyProviderBase} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';

import '@/components/utils/suppress-console'

interface Props {
    children: React.ReactNode;
}

const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: true,
});

export const PrivyProvider: React.FC<Props> = ({ children }) => {
    return (
        <PrivyProviderBase
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#d19900',
                    logo: 'https://www.askthehive.ai/logo-dark.png',
                    walletChainType: 'solana-only',
                    showWalletLoginFirst: true,
                },
                loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
                externalWallets: {
                    solana: {
                        connectors: solanaConnectors
                    }
                },
                solanaClusters: [
                    {
                        name: 'mainnet-beta',
                        rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
                    }
                ]
            }}
        >
            {children}
        </PrivyProviderBase>
    )
}