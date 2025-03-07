'use client'

import React from 'react'

import Header from './_components/header';
import Tokens from './_components/tokens';
import LiquidityPools from './_components/liquidity-pools';
import Transactions from './_components/transactions';
import ChainSelector from './_components/chain-selector';

import { SwapModalProvider } from './_contexts/use-swap-modal';

const Portfolio = ({ params }: { params: { address: string } }) => {

    const { address } = params;

    return (
        <SwapModalProvider>
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 md:pt-4 h-full overflow-y-scroll no-scrollbar">
                <div className="flex justify-between items-center">
                    <Header
                        address={address}
                    />
                    <ChainSelector />
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