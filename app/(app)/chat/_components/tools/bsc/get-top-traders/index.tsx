import React, { useState } from 'react'

import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

import WalletAddress from '@/app/_components/wallet-address';

import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { GetTopTradersResultBodyType, GetTopTradersResultType } from '@/ai/bsc/actions/market/get-top-traders/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetTopTraders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Top Traders...`}
            result={{
                heading: (result: GetTopTradersResultType) => result.body 
                    ? `Fetched Top Traders (${tool.args.timeFrame[0].toUpperCase() + tool.args.timeFrame.slice(1)})`
                    : `Failed to fetch top traders`,
                body: (result: GetTopTradersResultType) => result.body 
                    ? <TopTraders body={result.body} />
                    :  "No top traders found"
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    )
}

const TopTraders = ({ body }: { body: GetTopTradersResultBodyType }) => {
    const [showAll, setShowAll] = useState(false);

    return (
        <Card className="flex flex-col gap-2 w-full p-2">
            <Table className="text-center">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead className="text-center">Trader</TableHead>
                        <TableHead className="text-center">PNL</TableHead>
                        <TableHead className="text-center">Volume</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {body.traders.slice(0, showAll ? body.traders.length : 5).map((trader, index) => (
                        <TableRow key={trader.address}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="flex flex-col items-center">
                                <WalletAddress 
                                    address={trader.address} 
                                    className="font-medium"
                                />
                            </TableCell>
                            <TableCell className="text-green-500">
                                ${trader.pnl.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                                ${trader.volume.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {body.traders.length > 5 && (
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