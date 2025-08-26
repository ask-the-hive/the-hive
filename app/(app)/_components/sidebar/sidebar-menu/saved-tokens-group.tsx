'use client'

import React, { useState, useEffect } from 'react'

import { ChevronDown, Coins } from 'lucide-react';

import Link from 'next/link';

import { usePrivy } from '@privy-io/react-auth';

import { usePathname, useSearchParams } from 'next/navigation';

import { 
    SidebarMenuItem, 
    SidebarMenuButton,
    Skeleton,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui';

import { useSavedTokens } from '@/hooks';
import SaveToken from '../../save-token';
import { useChain } from '@/app/_contexts/chain-context';
import { cn } from '@/lib/utils';

const SavedTokensGroup: React.FC = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { currentChain } = useChain();
    const { user } = usePrivy();
    const { savedTokens, isLoading } = useSavedTokens();

    const [isOpen, setIsOpen] = useState(false);
    const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});
    const [tokenPrices, setTokenPrices] = useState<Record<string, { price: number; priceChange24hPercent: number }>>({});

    // Track previous length to detect when a token is added
    const [prevLength, setPrevLength] = useState(savedTokens.length);
    useEffect(() => {
        if (savedTokens.length > prevLength) {
            setIsOpen(true);
        }
        setPrevLength(savedTokens.length);
    }, [savedTokens.length, prevLength]);

    // Get the current chain from URL or context
    const chainParam = searchParams.get('chain');
    const chain = chainParam || currentChain;

    useEffect(() => {
        const fetchTokenData = async () => {
            if (!savedTokens) return;

            const newLogos: Record<string, string> = {};
            const newPrices: Record<string, { price: number; priceChange24hPercent: number }> = {};
            
            await Promise.all(
                savedTokens.map(async (token) => {
                    try {
                        // Fetch token overview to get both logo and price data
                        const response = await fetch(`/api/token/${token.id}/overview?chain=${token.chain || 'solana'}`);
                        if (!response.ok) throw new Error('Failed to fetch token overview');
                        
                        const data = await response.json();
                        
                        // Update logo if missing
                        if (!token.logoURI && data.logoURI) {
                            newLogos[token.id] = data.logoURI;
                        }
                        
                        // Update price data
                        if (data.price !== undefined && data.priceChange24hPercent !== undefined) {
                            newPrices[token.id] = {
                                price: data.price,
                                priceChange24hPercent: data.priceChange24hPercent
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch data for token ${token.id}:`, error);
                    }
                })
            );

            if (Object.keys(newLogos).length > 0) {
                setTokenLogos(prev => ({ ...prev, ...newLogos }));
            }
            
            if (Object.keys(newPrices).length > 0) {
                setTokenPrices(prev => ({ ...prev, ...newPrices }));
            }
        };

        fetchTokenData();
    }, [savedTokens]);

    const getTokenLogo = (token: any) => {
        // First try the saved token's logo URI
        if (token.logoURI) return token.logoURI;
        
        // Then try the fetched logos from our state
        if (tokenLogos[token.id]) return tokenLogos[token.id];
        
        // Finally, fall back to the default unknown token icon
        return "https://www.birdeye.so/images/unknown-token-icon.svg";
    };

    return (
        <Collapsible className="group/collapsible" open={isOpen} onOpenChange={setIsOpen}>
            <SidebarMenuItem>
                <Link href={`/token?chain=${chain}`}>
                    <CollapsibleTrigger 
                        asChild
                    >
                        <SidebarMenuButton 
                            className="justify-between w-full"
                            isActive={pathname.includes('/token')}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    <h1 className="text-sm font-semibold">Tokens</h1>
                                </div>
                                <ChevronDown 
                                    className="h-[14px] w-[14px] transition-transform group-data-[state=open]/collapsible:rotate-180 text-neutral-500 dark:text-neutral-500" 
                                />
                            </div>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </Link>
                <CollapsibleContent>
                    <SidebarMenuSub className="flex-1 overflow-y-auto max-h-60 relative flex flex-col black-scrollbar">
                        {
                            isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                savedTokens.length > 0 ? (
                                    savedTokens.map((savedToken) => (
                                        <SidebarMenuSubItem
                                            key={savedToken.id}
                                        >
                                            <SidebarMenuSubButton 
                                                asChild 
                                                isActive={pathname.includes(`/token/${savedToken.id}`)}
                                            >
                                                <Link 
                                                    href={`/token/${savedToken.id}?chain=${savedToken.chain || 'solana'}`} 
                                                    className="flex items-center justify-between w-full gap-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <img 
                                                            src={getTokenLogo(savedToken)} 
                                                            alt={savedToken.name}
                                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                                        />
                                                        <span className='truncate'>{savedToken.symbol}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tokenPrices[savedToken.id] && tokenPrices[savedToken.id].priceChange24hPercent !== null && tokenPrices[savedToken.id].priceChange24hPercent !== undefined && (
                                                            <span 
                                                                className={cn(
                                                                    "text-xs font-medium",
                                                                    tokenPrices[savedToken.id].priceChange24hPercent > 0 
                                                                        ? "text-green-500" 
                                                                        : "text-red-500"
                                                                )}
                                                            >
                                                                {tokenPrices[savedToken.id].priceChange24hPercent > 0 ? "+" : ""}
                                                                {tokenPrices[savedToken.id].priceChange24hPercent.toFixed(2)}%
                                                            </span>
                                                        )}
                                                        <SaveToken 
                                                            address={savedToken.id} 
                                                            className='hover:bg-neutral-300 dark:hover:bg-neutral-600 flex-shrink-0'
                                                        />
                                                    </div>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))
                                ) :
                                    user ? (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2 py-1'>
                                            No saved tokens
                                        </p>
                                    ) : (
                                        <p className='text-sm text-neutral-500 dark:text-neutral-400 pl-2'>
                                            Sign in to save tokens
                                        </p>
                                    )
                                )
                            }
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

export default SavedTokensGroup;