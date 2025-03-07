'use client'

import React from 'react'
import { useChain } from '@/app/_contexts/chain-context'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ChainType } from '@/app/_contexts/chain-context'

const ChainSelector: React.FC = () => {
    const { currentChain, setCurrentChain } = useChain()

    return (
        <div className="flex items-center">
            <RadioGroup 
                defaultValue={currentChain} 
                className="flex gap-4"
                onValueChange={(value: string) => setCurrentChain(value as ChainType)}
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solana" id="portfolio-solana" />
                    <Label htmlFor="portfolio-solana" className="flex items-center gap-1">
                        <img src="/solana.png" alt="Solana" className="w-4 h-4" />
                        Solana
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bsc" id="portfolio-bsc" />
                    <Label htmlFor="portfolio-bsc" className="flex items-center gap-1">
                        <img src="/bsc.png" alt="BSC" className="w-4 h-4" />
                        BSC
                    </Label>
                </div>
            </RadioGroup>
        </div>
    )
}

export default ChainSelector 