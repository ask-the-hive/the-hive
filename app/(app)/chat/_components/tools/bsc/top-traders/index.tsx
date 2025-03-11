import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import WalletAddress from '@/app/_components/wallet-address';

import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { TopTokenTradersResultType, TopTokenTradersResultBodyType } from '@/ai/bsc/actions/token/top-traders/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const TopTraders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Top Traders...`}
            result={{
                heading: (result: TopTokenTradersResultType) => result.body 
                    ? `Fetched Top Traders (${tool.args.timeFrame[0].toUpperCase() + tool.args.timeFrame.slice(1)})`
                    : `Failed to fetch top traders`,
                body: (result: TopTokenTradersResultType) => result.body 
                    ? <TopTradersTable body={result.body} />
                    : "No top traders found"
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    )
}

const TopTradersTable = ({ body }: { body: TopTokenTradersResultBodyType }) => {
    const [showAll, setShowAll] = useState(false);

    return (
        <Card className="flex flex-col gap-2 w-full p-2">
            <Table className="text-center">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead className="text-center">Trader</TableHead>
                        <TableHead className="text-center">Trades</TableHead>
                        <TableHead className="text-center">Volume</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {body.topTraders.slice(0, showAll ? body.topTraders.length : 5).map((trader, index) => (
                        <TableRow key={trader.owner}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="">
                                <div className="flex flex-col items-center justify-center h-full">
                                    <WalletAddress 
                                        address={trader.owner} 
                                        className="font-medium"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="">
                                <div className="flex flex-col w-full gap-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-red-500">
                                            {((trader.tradeSell / (trader.tradeBuy + trader.tradeSell)) * 100).toFixed(2)}%
                                        </span>
                                        <span className="text-green-500">
                                            {((trader.tradeBuy / (trader.tradeBuy + trader.tradeSell)) * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-red-500 h-full"
                                            style={{ 
                                                width: `${(trader.tradeSell / (trader.tradeBuy + trader.tradeSell)) * 100}%`
                                            }}
                                        />
                                        <div 
                                            className="bg-green-500 h-full"
                                            style={{ 
                                                width: `${(trader.tradeBuy / (trader.tradeBuy + trader.tradeSell)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-red-500">
                                            {trader.tradeSell.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-green-500">
                                            {trader.tradeBuy.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col w-full gap-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-green-500">
                                            {((trader.volumeBuy / (trader.volumeBuy + trader.volumeSell)) * 100).toFixed(2)}%
                                        </span>
                                        <span className="text-red-500">
                                            {((trader.volumeSell / (trader.volumeBuy + trader.volumeSell)) * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-green-500 h-full"
                                            style={{ 
                                                width: `${(trader.volumeBuy / (trader.volumeBuy + trader.volumeSell)) * 100}%`
                                            }}
                                        />
                                        <div 
                                            className="bg-red-500 h-full"
                                            style={{ 
                                                width: `${(trader.volumeSell / (trader.volumeBuy + trader.volumeSell)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-green-500">
                                            {new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(trader.volumeBuy)}
                                        </span>
                                        <span className="text-red-500">
                                            {new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(trader.volumeSell)}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {body.topTraders.length > 5 && (
                <Button
                    variant="ghost"
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll ? "Show Less" : "Show All"}
                </Button>
            )}
        </Card>
    )
}

export default TopTraders; 