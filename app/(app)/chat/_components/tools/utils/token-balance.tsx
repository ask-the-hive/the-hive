'use client'

import React from 'react'
import { Card } from '@/components/ui'

interface Props {
    balance: number;
    logoURI?: string;
    symbol?: string;
    token?: string;
    name?: string;
}

const TokenBalance: React.FC<Props> = ({ 
    balance, 
    logoURI, 
    symbol, 
    token, 
    name 
}) => {
    // Use token as symbol if symbol is not provided
    const displaySymbol = symbol || token || "Unknown";
    // Use name as fallback for the alt text
    const altText = `${displaySymbol || name || "Unknown"} token logo`;
    
    // The balance is already in the correct format, no need to divide by 10^decimals
    
    return (
        <Card className="flex items-center gap-2 p-2">
            <img 
                src={logoURI || "https://www.birdeye.so/images/unknown-token-icon.svg"} 
                alt={altText} 
                className="w-6 h-6 rounded-full" 
            />
            <div className="flex flex-col">
                <span className="text-sm font-medium">{balance.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}</span>
                <span className="text-xs text-muted-foreground">{displaySymbol}</span>
            </div>
        </Card>
    )
}

export default TokenBalance