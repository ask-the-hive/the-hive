'use client'

import React from 'react'
import MoralisChart from './moralis-chart'
import { useTokenOverview } from '@/hooks/queries/token/use-token-overview'

interface Props {
    mint: string;
}

const TokenChart: React.FC<Props> = ({ mint }) => {
    const { data: overview } = useTokenOverview(mint);
    const price = overview?.price || 0;
    const priceChange = overview?.priceChange24hPercent || 0;

    return <MoralisChart tokenAddress={mint} price={price} priceChange={priceChange} />;
}

export default TokenChart