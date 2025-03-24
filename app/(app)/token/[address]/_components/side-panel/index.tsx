'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeftRight, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui';

import Swap from '@/app/_components/swap';
import Chat from './chat';
import { ChatProvider } from '../../_contexts';
import { useChain } from '@/app/_contexts/chain-context';
import { ChainType } from '@/app/_contexts/chain-context';
import { WBNB_METADATA } from '@/lib/config/bsc';

import type { TokenChatData } from '@/types';
import type { Token } from '@/db/types';

// SOL token metadata
const SOL_METADATA: Token = {
    id: "So11111111111111111111111111111111111111112",
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
    tags: [],
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    freezeAuthority: null,
    mintAuthority: null,
    permanentDelegate: null,
    extensions: {}
};

interface Props {
    address: string;
}

const SidePanel: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc') 
        ? chainParam 
        : currentChain;
    
    const [tokenData, setTokenData] = useState<Token | null>(null);
    const [tokenChatData, setTokenChatData] = useState<TokenChatData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the initial sell token based on chain
    const initialSellToken = chain === 'bsc' ? WBNB_METADATA : SOL_METADATA;

    useEffect(() => {
        const fetchTokenData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`/api/token/${address}/data?chain=${chain}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch token data');
                }
                
                const data = await response.json();
                
                setTokenData(data);
                
                // Set token chat data
                if (data.overview) {
                    setTokenChatData({
                        address: data.id,
                        name: data.name,
                        symbol: data.symbol,
                        decimals: data.decimals,
                        extensions: data.extensions,
                        logoURI: data.logoURI,
                        supply: data.overview.supply,
                        circulatingSupply: data.overview.circulatingSupply,
                        chain
                    });
                } else {
                    setTokenChatData({
                        address: data.id,
                        name: data.name,
                        symbol: data.symbol,
                        decimals: data.decimals,
                        extensions: data.extensions,
                        logoURI: data.logoURI,
                        supply: 0,
                        circulatingSupply: 0,
                        chain
                    });
                }
            } catch (error) {
                console.error(error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTokenData();
    }, [address, chain]);

    if (loading) {
        return (
            <div className="h-full w-full p-4">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-[calc(100%-40px)] w-full" />
            </div>
        );
    }

    if (error || !tokenData || !tokenChatData) {
        return (
            <div className="h-full w-full p-4 text-center">
                <p className="text-red-500">Error loading token data</p>
            </div>
        );
    }

    return (
        <Tabs className="h-full flex flex-col items-start w-full max-w-full" defaultValue="chat">
            <TabsList className="p-0 h-[44px] justify-start bg-neutral-100 dark:bg-neutral-700 w-full max-w-full overflow-x-auto rounded-none no-scrollbar">
                <TabsTrigger 
                    value="chat"
                    className="h-full"
                >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                </TabsTrigger>
                <TabsTrigger 
                    value="trade"
                    className="h-full"
                >
                    <ArrowLeftRight className="w-4 h-4" />
                    Trade
                </TabsTrigger>
            </TabsList>
            <div className="flex-1 h-0 overflow-y-auto w-full no-scrollbar">
                <TabsContent value="chat" className="h-full m-0 p-2">
                    <ChatProvider token={tokenChatData}>
                        <Chat token={tokenChatData} />
                    </ChatProvider>
                </TabsContent>
                <TabsContent value="trade" className="h-full m-0 p-2">
                    <Swap 
                        initialInputToken={initialSellToken}
                        initialOutputToken={tokenData}
                        inputLabel="Sell"
                        outputLabel="Buy"
                        className="w-full"
                    />
                </TabsContent>
            </div>
        </Tabs>
    )
}

export default SidePanel;