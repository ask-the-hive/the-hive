"use client"

import React from 'react'

import { Coins } from 'lucide-react';

import Decimal from 'decimal.js';

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Button,
    Skeleton
} from '@/components/ui'

import { useSwapModal } from '../../_contexts/use-swap-modal';
import { usePortfolio } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';
import { cn } from '@/lib/utils';

interface Props {
    address: string
}

const Tokens: React.FC<Props> = ({ address }) => {
    const { currentChain, walletAddresses } = useChain();
    
    // Use the appropriate address for the current chain
    const chainAddress = currentChain === 'solana' 
        ? walletAddresses.solana || address 
        : walletAddresses.bsc || address;
    
    const { data: portfolio, isLoading } = usePortfolio(chainAddress, currentChain);

    const { onOpen } = useSwapModal();
    
    // Helper functions to open buy/sell modals
    const openBuy = (tokenAddress: string) => onOpen('buy', tokenAddress);
    const openSell = (tokenAddress: string) => onOpen('sell', tokenAddress);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <h2 className="text-lg font-bold">
                        Tokens
                    </h2>
                </div>
                {
                    portfolio && (
                        <p>
                            ${portfolio.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                        </p>
                    )
                }
            </div>
            {isLoading ? (
                <Skeleton className="h-64 w-full" />
            ) : (
                portfolio && portfolio.items.length > 0 ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="max-h-96 overflow-y-auto">
                                {
                                    portfolio.items
                                        .filter((token) => Number(token.balance) > 0 && token.symbol && token.priceUsd && token.valueUsd)
                                        .map((token) => (
                                            <TableRow key={token.address}>
                                                <TableCell>
                                                    <div className="font-medium flex gap-2 items-center">
                                                        {token.logoURI ? (
                                                            <img
                                                                src={token.logoURI}
                                                                alt={token.name}
                                                                className="w-4 h-4 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-gray-200" />
                                                        )}
                                                        <p>
                                                            {token.symbol}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Decimal(token.balance).div(10 ** token.decimals).toNumber().toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 4 })}
                                                </TableCell>
                                                <TableCell>
                                                    ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    ${token.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openBuy(token.address)}
                                                            className={cn(
                                                                "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200",
                                                                "dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50"
                                                            )}
                                                        >
                                                            Buy
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openSell(token.address)}
                                                            className={cn(
                                                                "bg-red-100 hover:bg-red-200 text-red-800 border border-red-200",
                                                                "dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-800/50"
                                                            )}
                                                        >
                                                            Sell
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                }
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 border rounded-md">
                        <p className="text-muted-foreground">No tokens found</p>
                    </div>
                )
            )}
        </div>
    )
}

export default Tokens