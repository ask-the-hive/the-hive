'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronsUpDown } from 'lucide-react';

import { 
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Input,
    Skeleton,
} from '@/components/ui'

import SaveToken from '../(app)/_components/save-token';

import { useSearchTokens } from '@/hooks/queries/token';
import { useChain, ChainType } from '@/app/_contexts/chain-context';

import { cn } from '@/lib/utils';

import { Token } from '@/db/types';
import type { TokenSearchResult } from '@/services/birdeye/types';

interface Props {
    value: Token | null,
    onChange: (token: Token | null) => void,
    priorityTokens?: string[]
}

const TokenSelect: React.FC<Props> = ({ value, onChange, priorityTokens = [] }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");

    const { tokens, isLoading } = useSearchTokens(input, chain);

    const sortedResults = React.useMemo(() => {
        if (!tokens) return [];
        
        return tokens.sort((a: TokenSearchResult, b: TokenSearchResult) => {
            const aIndex = priorityTokens.indexOf(a.address);
            const bIndex = priorityTokens.indexOf(b.address);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            return 0;
        }).map((token: TokenSearchResult) => ({
            id: token.address,
            symbol: token.symbol,
            name: token.name,
            logoURI: token.logo_uri,
            decimals: 0,
            tags: [],
            extensions: {},
            freezeAuthority: null,
            mintAuthority: null,
            permanentDelegate: null,
        }));
    }, [tokens, priorityTokens, input]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className="w-fit shrink-0 flex items-center bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md px-2 py-1 gap-2 cursor-pointer transition-colors duration-200"
                >
                    {
                        value ? (
                            <img 
                                src={value.logoURI || 'https://www.birdeye.so/images/unknown-token-icon.svg'} 
                                alt={value.name} 
                                className="w-6 h-6 rounded-full" 
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-600" />
                        )
                    }
                    <p className={cn(
                        "text-xs font-bold",
                        value ? "opacity-100" : "opacity-50"
                    )}>
                        {value ? value.symbol : "Select"}
                    </p>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 flex flex-col gap-2">
                <Input
                    placeholder="Search tokens..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                {
                    isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-scroll">
                            {
                                input ? (
                                    sortedResults.length === 0 ? (
                                        <p className="text-xs text-neutral-500">
                                            No results for &quot;{input}&quot;
                                        </p>
                                    ) : (
                                        sortedResults.map((token: Token) => (
                                            <Button 
                                                key={token.id}
                                                variant="ghost"
                                                className="w-full justify-start px-1"
                                                onClick={() => {
                                                    setOpen(false);
                                                    onChange(token);
                                                }}
                                            >
                                                <img 
                                                    src={token.logoURI || "https://www.birdeye.so/images/unknown-token-icon.svg"} 
                                                    alt={token.name} 
                                                    className="w-6 h-6 rounded-full" 
                                                />
                                                <p className="text-sm font-bold">
                                                    {token.symbol}
                                                </p>
                                                <SaveToken address={token.id} />
                                            </Button>
                                        ))
                                    )
                                ) : (
                                    <p className="text-xs text-neutral-500">
                                        Search for a token
                                    </p>
                                )
                            }
                        </div>
                    )
                }
            </PopoverContent>
        </Popover>
    )
}

export default TokenSelect