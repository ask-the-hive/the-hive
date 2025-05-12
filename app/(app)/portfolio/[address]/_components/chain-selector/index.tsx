'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useChain } from '@/app/_contexts/chain-context'
import { ChainType } from '@/app/_contexts/chain-context'

const ChainSelector = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { currentChain, setCurrentChain, walletAddresses } = useChain()

    const handleChainChange = (chain: ChainType) => {
        setCurrentChain(chain)
        
        // Get the appropriate wallet address for the selected chain
        const newAddress = chain === 'solana' 
            ? walletAddresses.solana 
            : chain === 'bsc'
                ? walletAddresses.bsc
                : walletAddresses.base
        
        if (!newAddress) {
            return; // Don't update URL if we don't have a wallet address for this chain
        }

        // Update URL with new chain and address
        const params = new URLSearchParams(searchParams)
        params.set('chain', chain)
        router.replace(`/portfolio/${newAddress}?${params.toString()}`)
    }

    return (
        <RadioGroup 
            defaultValue={currentChain}
            value={currentChain}
            onValueChange={handleChainChange}
            className="flex gap-2"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="solana" id="solana" />
                <Label htmlFor="solana" className="flex items-center gap-1">
                    <img src="/chains/solana.svg" alt="Solana" className="w-4 h-4" />
                    Solana
                </Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="bsc" id="bsc" />
                <Label htmlFor="bsc" className="flex items-center gap-1">
                    <img src="/chains/bsc.svg" alt="BSC" className="w-4 h-4" />
                    BSC
                </Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="base" id="base" />
                <Label htmlFor="base" className="flex items-center gap-1">
                    <img src="/chains/base.svg" alt="Base" className="w-4 h-4" />
                    Base
                </Label>
            </div>
        </RadioGroup>
    )
}

export default ChainSelector 