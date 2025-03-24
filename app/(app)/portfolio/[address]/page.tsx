'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import Header from './_components/header';
import Tokens from './_components/tokens';
import LiquidityPools from './_components/liquidity-pools';
import Transactions from './_components/transactions';

import { SwapModalProvider } from './_contexts/use-swap-modal';
import { useChain } from '@/app/_contexts/chain-context';

const Portfolio = ({ params }: { params: Promise<{ address: string }> }) => {
    // Unwrap params using React.use()
    const { address } = React.use(params);
    const router = useRouter();
    const { currentChain, walletAddresses } = useChain();

    // Update URL when chain changes to show correct wallet address
    React.useEffect(() => {
        const newAddress = currentChain === 'solana' ? walletAddresses.solana : walletAddresses.bsc;
        if (newAddress && newAddress !== address) {
            router.replace(`/portfolio/${newAddress}`);
        }
    }, [currentChain, walletAddresses, address, router]);

    return (
        <SwapModalProvider>
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 md:pt-4 h-full overflow-y-scroll no-scrollbar">
                <div className="flex justify-between items-center">
                    <Header
                        address={address}
                    />
                </div>
                <Tokens
                    address={address}
                />
                <LiquidityPools
                    address={address}
                />
                <Transactions
                    address={address}
                />
            </div>
        </SwapModalProvider>
    )
}

export default Portfolio;