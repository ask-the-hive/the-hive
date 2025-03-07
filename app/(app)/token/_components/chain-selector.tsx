'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChain } from '@/app/_contexts/chain-context'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui'
import ChainIcon from '@/app/(app)/_components/chain-icon'

const ChainSelector: React.FC = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { currentChain, setCurrentChain } = useChain()

    // Sync URL params with context
    useEffect(() => {
        const chainParam = searchParams.get('chain')
        if (chainParam && (chainParam === 'solana' || chainParam === 'bsc')) {
            setCurrentChain(chainParam)
        }
    }, [searchParams, setCurrentChain])

    const handleChainChange = (value: string) => {
        const newChain = value as 'solana' | 'bsc'
        setCurrentChain(newChain)
        
        // Update URL
        const params = new URLSearchParams(searchParams.toString())
        params.set('chain', newChain)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Chain:</span>
            <Select
                value={currentChain}
                onValueChange={handleChainChange}
            >
                <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="solana">
                        <div className="flex items-center gap-2">
                            <ChainIcon chain="solana" className="size-4" />
                            <span>Solana</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="bsc">
                        <div className="flex items-center gap-2">
                            <ChainIcon chain="bsc" className="size-4" />
                            <span>BSC</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

export default ChainSelector 