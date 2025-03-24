"use client";

import React from 'react'

import RaydiumStandardPortfolio from './raydium-standard';
import { useChain } from '@/app/_contexts/chain-context';

interface Props {
    address: string
}

const LiquidityPools: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();

    // Only show liquidity pools for Solana
    if (currentChain !== 'solana') {
        return null;
    }

    return (
        <RaydiumStandardPortfolio address={address} />
    )
}

export default LiquidityPools