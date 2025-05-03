import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import WalletAddress from '@/app/_components/wallet-address';

import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { GetTopTradersResultBodyType } from '@/ai/bsc/actions/market/get-top-traders/types';
import type { BscActionResult } from '@/ai/bsc/actions/bsc-action';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetTopTraders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText="Getting Top Traders..."
            result={{
                heading: (result: BscActionResult<GetTopTradersResultBodyType>) => result.body 
                    ? `Fetched Top Traders (${tool.args.timeFrame[0].toUpperCase() + tool.args.timeFrame.slice(1)})`
                    : "Failed to fetch top traders",
                body: (result: BscActionResult<GetTopTradersResultBodyType>) => result.body 
                    ? <TopTraders body={result.body} />
                    : "No top traders found"
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    )
}

const TopTraders = ({ body }: { body: GetTopTradersResultBodyType }) => {
    const [showAll, setShowAll] = useState(false);
    
    const traders = Array.isArray(body.traders) ? body.traders : [];
    
    if (traders.length === 0) {
        return (
            <Card className="flex flex-col gap-2 w-full p-2">
                <p className="text-center py-4">No traders found.</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-2 w-full p-2">
            <Table className="text-center">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead className="text-center">Trader</TableHead>
                        <TableHead className="text-center">PNL</TableHead>
                        <TableHead className="text-center">Volume</TableHead>
                        <TableHead className="text-center">Trades</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {traders.slice(0, showAll ? traders.length : 5).map((trader, index) => (
                        <TableRow key={trader.address}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <div className="flex flex-col items-center justify-center h-full">
                                    <WalletAddress 
                                        address={trader.address} 
                                        className="font-medium"
                                        chain="bsc"
                                    />
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={trader.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                    ${new Intl.NumberFormat('en-US', { 
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }).format(Math.abs(trader.pnl))}
                                </span>
                            </TableCell>
                            <TableCell>
                                ${new Intl.NumberFormat('en-US', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }).format(trader.volume)}
                            </TableCell>
                            <TableCell>
                                {new Intl.NumberFormat('en-US').format(trader.trade_count)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {traders.length > 5 && (
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

export default GetTopTraders; 