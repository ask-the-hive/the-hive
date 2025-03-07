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
    Card,
    Button,
    Skeleton
} from '@/components/ui'

import { useSwapModal } from '../../_contexts/use-swap-modal';
import { usePortfolio } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';

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

    const { openSell, openBuy } = useSwapModal();

    // Check if we have a valid address for the current chain
    const hasValidAddress = currentChain === 'solana' 
        ? chainAddress && !chainAddress.startsWith('0x')
        : chainAddress && chainAddress.startsWith('0x');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <h2 className="text-lg font-bold">
                        Tokens {currentChain === 'bsc' ? '(BSC)' : '(Solana)'}
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
            {
                !hasValidAddress ? (
                    <div className="flex flex-col items-center justify-center h-64 border rounded-md">
                        <p className="text-yellow-500">
                            No {currentChain === 'solana' ? 'Solana' : 'BSC'} wallet connected. 
                            Please link a {currentChain === 'solana' ? 'Solana' : 'BSC'} wallet.
                        </p>
                    </div>
                ) : isLoading ? (
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
                                        {currentChain === 'solana' && <TableHead>Actions</TableHead>}
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
                                                        {new Decimal(token.balance).div(10 ** token.decimals).toNumber().toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell>
                                                        ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell>
                                                        ${token.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    {currentChain === 'solana' && (
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openBuy(token.address)}
                                                                >
                                                                    Buy
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openSell(token.address)}
                                                                >
                                                                    Sell
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
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
                )
            }
        </div>
    )
}

export default Tokens