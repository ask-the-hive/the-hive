'use client'

import React, { useRef, useEffect } from 'react'

import { GiSwapBag } from 'react-icons/gi'
import { IoSwapHorizontal } from 'react-icons/io5'
import { MdBubbleChart } from 'react-icons/md'
import { FaXTwitter, FaAt, FaWater } from 'react-icons/fa6'
import { ChartCandlestick, Receipt } from 'lucide-react'

import { Tabs, TabsTrigger, TabsContent } from '@/components/ui'
import DraggableTabsList from './draggable-tabs-list'

import TopHolders from './top-holders';
import TopTraders from './top-traders';
import BubbleMap from './bubble-map';
import AccountTweets from './account-tweets';
import AccountMentions from './account-mentions';
import TokenMarkets from './markets'
import MarketStats from './market-stats'
import TransactionsTab from './transactions'

import { getTokenOverview } from '@/services/birdeye';
import { useIsMobile } from '@/hooks/utils/use-mobile';

interface Props {
    address: string;
    tokenOverview: Awaited<ReturnType<typeof getTokenOverview>>;
}

// Helper function to validate Twitter URL and extract username
const getValidTwitterUsername = (twitterUrl: string): string | null => {
    try {
        const url = new URL(twitterUrl);
        
        // Check if it's a Twitter/X URL
        if (!url.hostname.includes('twitter.com') && !url.hostname.includes('x.com')) {
            return null;
        }
        
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Valid profile URL should be like: twitter.com/username or twitter.com/username/
        // Invalid URLs would be like: twitter.com/username/status/123456789
        if (pathParts.length === 1 && pathParts[0] && !pathParts[0].includes('status')) {
            return pathParts[0];
        }
        
        return null;
    } catch {
        return null;
    }
};

const TokenDashboardTabs: React.FC<Props> = ({ address, tokenOverview }) => {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = React.useState('market-stats')
    const tabsRef = useRef<{ [key: string]: HTMLButtonElement }>({})

    const scrollToTab = (value: string) => {
        const tab = tabsRef.current[value]
        if (tab) {
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }

    useEffect(() => {
        scrollToTab(activeTab)
    }, [activeTab])

    // Get valid Twitter username if available
    const validTwitterUsername = tokenOverview?.extensions?.twitter 
        ? getValidTwitterUsername(tokenOverview.extensions.twitter)
        : null;

    return (
        <Tabs 
            className={isMobile ? 'flex flex-col items-start w-full max-w-full' : 'h-full flex flex-col items-start w-full max-w-full'}
            defaultValue="market-stats"
            value={activeTab}
            onValueChange={setActiveTab}
        >
            <DraggableTabsList selectedTab={activeTab}>
                <TabsTrigger 
                    value="market-stats"
                    ref={(el) => {
                        if (el) tabsRef.current['market-stats'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <ChartCandlestick className="w-4 h-4" />
                    Market Stats
                </TabsTrigger>
                <TabsTrigger 
                    value="holders"
                    ref={(el) => {
                        if (el) tabsRef.current['holders'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <GiSwapBag className="w-4 h-4" />
                    Holders
                </TabsTrigger>
                <TabsTrigger 
                    value="traders"
                    ref={(el) => {
                        if (el) tabsRef.current['traders'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <IoSwapHorizontal className="w-4 h-4" />
                    Traders
                </TabsTrigger>
                <TabsTrigger 
                    value="transactions"
                    ref={(el) => {
                        if (el) tabsRef.current['transactions'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <Receipt className="w-4 h-4" />
                    Transactions
                </TabsTrigger>
                <TabsTrigger 
                    value="bubble"
                    ref={(el) => {
                        if (el) tabsRef.current['bubble'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <MdBubbleChart className="w-4 h-4" />
                    Bubble Map
                </TabsTrigger>
                <TabsTrigger 
                    value="markets"
                    ref={(el) => {
                        if (el) tabsRef.current['markets'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaWater className="w-4 h-4" />
                    Markets
                </TabsTrigger>
                <TabsTrigger 
                    value="tweets"
                    ref={(el) => {
                        if (el) tabsRef.current['tweets'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaXTwitter className="w-4 h-4" />
                    Tweets
                </TabsTrigger>
                <TabsTrigger 
                    value="mentions"
                    ref={(el) => {
                        if (el) tabsRef.current['mentions'] = el
                    }}
                    className="flex-1 min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaAt className="w-4 h-4" />
                    Mentions
                </TabsTrigger>
            </DraggableTabsList>
            <div className={isMobile ? 'w-full no-scrollbar' : 'flex-1 h-0 overflow-y-auto w-full no-scrollbar'}>
                <TabsContent value="market-stats" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
                    <MarketStats address={address} />
                </TabsContent>
                <TabsContent value="holders" className={isMobile ? 'm-0' : 'h-full m-0'}>
                    <TopHolders mint={address} />
                </TabsContent>
                <TabsContent value="traders" className={isMobile ? 'm-0' : 'h-full m-0'}>
                    <TopTraders address={address} />
                </TabsContent>
                <TabsContent value="transactions" className={isMobile ? 'm-0' : 'h-full m-0'}>
                    <TransactionsTab address={address} />
                </TabsContent>
                <TabsContent value="bubble" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
                    <BubbleMap address={address} />
                </TabsContent>
                <TabsContent value="markets" className={isMobile ? 'm-0' : 'h-full m-0'}>
                    <TokenMarkets address={address} />
                </TabsContent>
                <TabsContent value="tweets" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
                    {validTwitterUsername ? (
                        <AccountTweets username={validTwitterUsername} />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full p-4">
                            <div className="text-center max-w-md">
                                <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    Tweets Data Not Available
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    {tokenOverview?.name || 'This token'} has no official Twitter profile.
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="mentions" className={isMobile ? 'm-0 p-2' : 'h-full m-0 p-2'}>
                    {validTwitterUsername ? (
                        <AccountMentions username={validTwitterUsername} />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full p-4">
                            <div className="text-center max-w-md">
                                <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    Mentions Data Not Available
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    {tokenOverview?.name || 'This token'} has no official Twitter profile.
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </div>
        </Tabs>
    )
}

export default TokenDashboardTabs