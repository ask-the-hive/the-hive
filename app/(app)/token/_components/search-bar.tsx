'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useChain } from '@/app/_contexts/chain-context';

import {
    Button,
    Input, 
    Skeleton, 
} from '@/components/ui';

import SaveToken from '../../_components/save-token';

import { useDebounce } from '@/hooks';
import { useSearchTokens } from '@/hooks/queries/token/use-search-tokens';

import type { TokenSearchResult } from '@/services/birdeye/types';
import { ChainType } from '@/app/_contexts/chain-context';

const SearchBar: React.FC = () => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const inputRef = useRef<HTMLInputElement>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const debouncedValue = useDebounce(inputValue, 500);

    const { tokens, isLoading } = useSearchTokens(debouncedValue, chain);

    const sortTokens = (tokens: TokenSearchResult[]) => {
        // Define priority addresses for each chain
        const priorityAddresses = {
            solana: new Set([
                'So11111111111111111111111111111111111111112', // SOL
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
            ]),
            bsc: new Set([
                '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB/BNB
                '0x55d398326f99059fF775485246999027B3197955', // USDT
                '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
                '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
            ]),
            base: new Set([
                '0x4200000000000000000000000000000000000006', // WETH
                '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDC
                '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
            ])
        };
        
        const currentPriorityAddresses = priorityAddresses[chain] || new Set();
        
        // Split tokens into priority and non-priority
        const priorityTokens = tokens.filter(token => 
            currentPriorityAddresses.has(token.address)
        );
        
        const nonPriorityTokens = tokens.filter(token => 
            !currentPriorityAddresses.has(token.address)
        );
        
        // Return priority tokens first, followed by the rest (already sorted by volume from API)
        return [...priorityTokens, ...nonPriorityTokens];
    };

    const sortedResults = sortTokens(tokens);
    const placeholderIcon = "https://www.birdeye.so/images/unknown-token-icon.svg";

    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Search</h2>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
                <Input
                    placeholder="Search tokens..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pl-9 w-full cursor-text bg-neutral-200 dark:bg-neutral-800"
                    ref={inputRef}
                    onFocus={() => setIsFocused(true)}
                    onBlur={(e) => {
                        if (!e.relatedTarget?.closest('.search-results')) {
                            setIsFocused(false);
                        }
                    }}
                    autoFocus
                />
                {isFocused && (
                    <div 
                        className="search-results absolute top-full left-0 right-0 mt-2 bg-popover border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 rounded-md shadow-md z-50"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {isLoading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : (
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                {inputValue ? (
                                    sortedResults.length === 0 ? (
                                        <p className="text-xs text-muted-foreground p-2">
                                            No results for &quot;{inputValue}&quot;
                                        </p>
                                    ) : (
                                        sortedResults.map((token: TokenSearchResult) => (
                                            <Link
                                                href={`/token/${token.address}?chain=${chain}`}
                                                key={token.address}
                                                onMouseDown={(e) => e.preventDefault()}
                                                className="h-fit"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start gap-4 px-2 py-1 h-fit"
                                                >
                                                    <img
                                                        src={token.logo_uri || placeholderIcon}
                                                        alt={token.name}
                                                        className="rounded-full size-8"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = placeholderIcon;
                                                        }}
                                                    />
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-bold text-sm">{token.name} ({token.symbol})</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${(token.price || 0).toLocaleString(undefined, { maximumFractionDigits: 5 })} 
                                                            {typeof token.price_change_24h_percent === 'number' && (
                                                                <span className={token.price_change_24h_percent > 0 ? 'text-green-500' : 'text-red-500'}>
                                                                    ({token.price_change_24h_percent > 0 ? '+' : ''}
                                                                    {token.price_change_24h_percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <SaveToken address={token.address} />
                                                </Button>
                                            </Link>
                                        ))
                                    )
                                ) : (
                                    <p className="text-xs text-muted-foreground p-2">
                                        Start typing to search for tokens by name or address
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchBar