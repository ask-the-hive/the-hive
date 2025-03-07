'use client'

import React, { useRef, useEffect } from 'react'

import { GiSwapBag } from 'react-icons/gi'
import { IoSwapHorizontal } from 'react-icons/io5'
import { MdBubbleChart } from 'react-icons/md'
import { FaXTwitter, FaAt, FaWater, FaUsers } from 'react-icons/fa6'
import { ChartCandlestick } from 'lucide-react'

import { Tabs, TabsTrigger, TabsContent } from '@/components/ui'
import DraggableTabsList from './draggable-tabs-list'

import TopHolders from './top-holders';
import TopTraders from './top-traders';
import BubbleMap from './bubble-map';
import AccountTweets from './account-tweets';
import AccountMentions from './account-mentions';
import TokenMarkets from './markets'
import TokenUsersOverTime from './users-over-time'
import MarketStats from './market-stats'

import { getTokenOverview } from '@/services/birdeye';

interface Props {
    address: string;
    tokenOverview: Awaited<ReturnType<typeof getTokenOverview>>;
}

const TokenDashboardTabs: React.FC<Props> = ({ address, tokenOverview }) => {
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

    return (
        <Tabs 
            className="h-full flex flex-col items-start w-full max-w-full" 
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
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <ChartCandlestick className="w-4 h-4" />
                    Market Stats
                </TabsTrigger>
                <TabsTrigger 
                    value="holders"
                    ref={(el) => {
                        if (el) tabsRef.current['holders'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <GiSwapBag className="w-4 h-4" />
                    Holders
                </TabsTrigger>
                <TabsTrigger 
                    value="traders"
                    ref={(el) => {
                        if (el) tabsRef.current['traders'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <IoSwapHorizontal className="w-4 h-4" />
                    Traders
                </TabsTrigger>
                <TabsTrigger 
                    value="bubble"
                    ref={(el) => {
                        if (el) tabsRef.current['bubble'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <MdBubbleChart className="w-4 h-4" />
                    Bubble Map
                </TabsTrigger>
                <TabsTrigger 
                    value="markets"
                    ref={(el) => {
                        if (el) tabsRef.current['markets'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaWater className="w-4 h-4" />
                    Markets
                </TabsTrigger>
                <TabsTrigger 
                    value="users-over-time"
                    ref={(el) => {
                        if (el) tabsRef.current['users-over-time'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaUsers className="w-4 h-4" />
                    Active Wallets
                </TabsTrigger>
                <TabsTrigger 
                    value="tweets"
                    ref={(el) => {
                        if (el) tabsRef.current['tweets'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaXTwitter className="w-4 h-4" />
                    Tweets
                </TabsTrigger>
                <TabsTrigger 
                    value="mentions"
                    ref={(el) => {
                        if (el) tabsRef.current['mentions'] = el
                    }}
                    className="min-w-fit whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800"
                >
                    <FaAt className="w-4 h-4" />
                    Mentions
                </TabsTrigger>
            </DraggableTabsList>
            <div className="flex-1 h-0 overflow-y-auto w-full no-scrollbar">
                <TabsContent value="market-stats" className="h-full m-0 p-2">
                    <MarketStats address={address} />
                </TabsContent>
                <TabsContent value="holders" className="h-full m-0">
                    <TopHolders mint={address} />
                </TabsContent>
                <TabsContent value="traders" className="h-full m-0">
                    <TopTraders address={address} />
                </TabsContent>
                <TabsContent value="bubble" className="h-full m-0 p-2">
                    <BubbleMap address={address} />
                </TabsContent>
                <TabsContent value="markets" className="h-full m-0">
                    <TokenMarkets address={address} />
                </TabsContent>
                <TabsContent value="users-over-time" className="h-full m-0 p-2">
                    <TokenUsersOverTime mint={address} />
                </TabsContent>
                <TabsContent value="tweets" className="h-full m-0 p-2">
                    {tokenOverview.extensions?.twitter ? (
                        <AccountTweets username={tokenOverview.extensions.twitter.split('/').pop()!} />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full p-4">
                            <div className="text-center max-w-md">
                                <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    Twitter Data Not Available
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    This token has no Twitter Presence.
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="mentions" className="h-full m-0 p-2">
                    {tokenOverview.extensions?.twitter ? (
                        <AccountMentions username={tokenOverview.extensions.twitter.split('/').pop()!} />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full p-4">
                            <div className="text-center max-w-md">
                                <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    Mentions Data Not Available
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    This token has no Twitter Presence.
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