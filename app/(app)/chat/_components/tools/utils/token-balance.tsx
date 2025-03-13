'use client'

import React from 'react'

interface Props {
    balance: number;
    decimals?: number;
    logoURI?: string;
    symbol?: string;
    token?: string;
    name?: string;
}

const TokenBalance: React.FC<Props> = ({ 
    balance, 
    decimals = 18, 
    logoURI, 
    symbol, 
    token, 
    name 
}) => {
    // Use token as symbol if symbol is not provided
    const displaySymbol = symbol || token || "Unknown";
    // Use name as fallback for the alt text
    const altText = `${displaySymbol || name || "Unknown"} token logo`;
    
    return (
        <div className="flex items-center gap-2">
            <img 
                src={logoURI} 
                alt={altText} 
                className="w-6 h-6 rounded-full" 
            />
            <div className="flex flex-col">
                <span className="text-sm font-medium">{(balance / Math.pow(10, decimals)).toFixed(4)}</span>
                <span className="text-xs text-muted-foreground">{displaySymbol}</span>
            </div>
        </div>
    )
}

export default TokenBalance