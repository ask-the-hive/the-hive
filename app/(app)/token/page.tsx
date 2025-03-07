'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useChain } from '@/app/_contexts/chain-context'
import { ChainType } from '@/app/_contexts/chain-context'

import SearchBar from './_components/search-bar'
import TrendingTokens from './_components/trending-tokens'
import SmartMoneyTokens from './_components/smart-money'
import ChainSelector from './_components/chain-selector'

const TokenPage: React.FC = () => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full h-full max-h-full overflow-y-auto px-1">
            <div className="flex justify-between items-center">
                <h1 className='text-2xl font-bold'>Tokens</h1>
                <ChainSelector />
            </div>
            <SearchBar />
            <TrendingTokens />
            {chain === 'solana' && <SmartMoneyTokens />}
        </div>
    )
}

export default TokenPage