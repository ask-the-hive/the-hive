'use client'

import React from 'react'
import Image from 'next/image'
import { ChainType } from '@/app/_contexts/chain-context'

interface Props {
    chain: ChainType;
    className?: string;
}

const ChainIcon: React.FC<Props> = ({ chain, className = "size-8" }) => {
    const iconPath = chain === 'bsc' 
        ? '/chains/bsc.png' 
        : chain === 'base' 
            ? '/chains/base.png'
            : '/chains/solana.png';
    
    return (
        <Image
            src={iconPath}
            alt={chain === 'bsc' 
                ? 'BSC Chain' 
                : chain === 'base'
                    ? 'Base Chain'
                    : 'Solana Chain'}
            width={32}
            height={32}
            className={`rounded-full ${className}`}
        />
    );
}

export default ChainIcon; 