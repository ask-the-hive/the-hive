'use client'

import React, { useState } from 'react'
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
import { useChain } from '@/app/_contexts/chain-context';

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
    
    // Always use currentChain for token search in swap modals
    const chain = currentChain;
    
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");

    const { tokens, isLoading } = useSearchTokens(input, chain);

    const sortedResults = React.useMemo(() => {
        if (!tokens) return [];
        
        let results = [...tokens];
        
        // Inject ETH token for Base chain when searching for "ETH" or "WETH"
        if (chain === 'base' && (input.toLowerCase() === 'eth' || input.toLowerCase() === 'weth')) {
            const ethToken: TokenSearchResult = {
                address: '0x4200000000000000000000000000000000000006',
                name: 'Ethereum',
                symbol: 'ETH',
                logo_uri: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
                price: 0,
                price_change_24h_percent: 0,
                market_cap: 0,
                fdv: 0,
                decimals: 18,
                liquidity: 0,
                volume_24h_change_percent: null,
                network: 'base',
                buy_24h: 0,
                buy_24h_change_percent: null,
                sell_24h: 0,
                sell_24h_change_percent: null,
                trade_24h: 0,
                trade_24h_change_percent: null,
                unique_wallet_24h: 0,
                unique_view_24h_change_percent: null,
                last_trade_human_time: '',
                last_trade_unix_time: 0,
                creation_time: '',
                volume_24h_usd: 0,
                verified: true
            };
            
            // Check if ETH token is already in results
            const ethExists = results.some(token => 
                token.address === '0x4200000000000000000000000000000000000006' ||
                token.symbol?.toUpperCase() === 'ETH'
            );
            
            if (!ethExists) {
                results = [ethToken, ...results];
            }
        }
        
        return results.sort((a: TokenSearchResult, b: TokenSearchResult) => {
            const aIndex = priorityTokens.indexOf(a.address);
            const bIndex = priorityTokens.indexOf(b.address);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            return 0;
        }).map((token: TokenSearchResult) => ({
            ...token,
            id: token.address,
            logoURI: token.logo_uri
        }));
    }, [tokens, priorityTokens, chain, input]);

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
                                sortedResults.length === 0 ? (
                                    <p className="text-xs text-neutral-500">
                                        {
                                            input 
                                                ? `No results for "${input}"`
                                                : "No tokens found"
                                        }
                                    </p>
                                ) : (
                                    sortedResults.map((token: TokenSearchResult) => (
                                        <Button 
                                            key={token.address}
                                            variant="ghost"
                                            className="w-full justify-start px-1"
                                            onClick={() => {
                                                setOpen(false);
                                                onChange({
                                                    id: token.address,
                                                    name: token.name,
                                                    symbol: token.symbol,
                                                    decimals: token.decimals,
                                                    logoURI: token.logo_uri,
                                                    tags: [],
                                                    freezeAuthority: null,
                                                    mintAuthority: null,
                                                    permanentDelegate: null,
                                                    extensions: {}
                                                });
                                            }}
                                        >
                                            <img
                                                src={token.logo_uri || "https://www.birdeye.so/images/unknown-token-icon.svg"} 
                                                alt={token.name}
                                                className="w-6 h-6 rounded-full" 
                                            />
                                            <p className="text-sm font-bold">
                                                {token.symbol}
                                            </p>
                                            <SaveToken address={token.address} />
                                        </Button>
                                    ))
                                )
                            }
                        </div>
                    )
                }
            </PopoverContent>
        </Popover>
    );
}

export default TokenSelect;