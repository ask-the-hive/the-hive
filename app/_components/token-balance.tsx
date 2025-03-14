'use client'

import React from 'react'

interface Props {
    symbol: string,
    balance: number,
    logoURI: string,
    name: string,
    price: number
}

const TokenBalance: React.FC<Props> = ({ symbol, balance, logoURI, name, price }) => {

    return (
        <div className="flex flex-row items-center gap-2">
            <img 
                src={logoURI && logoURI.length > 0 ? logoURI : "https://www.birdeye.so/images/unknown-token-icon.svg"} 
                alt={name} 
                className="w-8 h-8 rounded-full" 
            />
            <div className="flex flex-col">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{name} ({symbol})</p>
                <p className="text-md font-bold">{balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-xs text-neutral-600 dark:text-neutral-400">${(price * balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
            </div>
        </div>
    )
}

export default TokenBalance