"use client";

import React from "react";
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";

import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { Badge } from "@/components/ui/badge";

import WalletAddress from "@/app/_components/wallet-address";
import { useTokenTransactions } from "@/hooks";
import { useChain } from "@/app/_contexts/chain-context";
import { useSearchParams } from "next/navigation";
import { ChainType } from "@/app/_contexts/chain-context";
import { knownAddresses } from "@/lib/known-addresses";
import { Transaction } from "@/services/birdeye/types";

interface Props {
    address: string;
}

const formatAmount = (amount: number): string => {
    if (amount === 0) return '0';
    
    const absAmount = Math.abs(amount);
    if (absAmount >= 1e9) {
        return `${(absAmount / 1e9).toFixed(2)}B`;
    } else if (absAmount >= 1e6) {
        return `${(absAmount / 1e6).toFixed(2)}M`;
    } else if (absAmount >= 1e3) {
        return `${(absAmount / 1e3).toFixed(2)}K`;
    } else {
        return absAmount.toFixed(2);
    }
};

const formatPrice = (price: number): string => {
    if (price === 0) return '$0.00';
    
    if (price >= 1) {
        return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
        return `$${price.toFixed(4)}`;
    } else {
        return `$${price.toExponential(2)}`;
    }
};

const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else {
        return `${seconds}s ago`;
    }
};

const TransactionsTab: React.FC<Props> = ({ address }) => {
    const { currentChain } = useChain();
    const searchParams = useSearchParams();
    const chainParam = searchParams.get('chain') as ChainType | null;
    
    // Use URL param if available, otherwise use context
    const chain = chainParam && (chainParam === 'solana' || chainParam === 'bsc' || chainParam === 'base') 
        ? chainParam 
        : currentChain;
    
    const { data: transactionsData, isLoading } = useTokenTransactions({ 
        address, 
        limit: 20 
    });

    if (isLoading) {
        return <Skeleton className="h-full w-full" />;
    }

    if (!transactionsData?.items || transactionsData.items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full p-4">
                <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                        No Transactions Found
                    </h3>
                    <p className="text-sm text-neutral-500">
                        No recent transactions found for this token.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 pl-4">Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-16">Tx</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactionsData.items.map((tx: Transaction, index: number) => (
                    <TableRow key={`${tx.txHash}-${index}`}>
                        <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                                {tx.side === 'buy' ? (
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                ) : (
                                    <ArrowDownLeft className="w-4 h-4 text-red-500" />
                                )}
                                <Badge variant={tx.side === 'buy' ? 'default' : 'secondary'}>
                                    {tx.side.toUpperCase()}
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {formatAmount(tx.quote.uiAmount)} {tx.quote.symbol}
                                </span>
                                <span className="text-xs text-neutral-500">
                                    {formatAmount(tx.base.uiAmount)} {tx.base.symbol}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {formatPrice(tx.quotePrice)}
                                </span>
                                <span className="text-xs text-neutral-500">
                                    {formatPrice(tx.basePrice)}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="w-48">
                            {knownAddresses[tx.owner] ? (
                                <div className="flex flex-row items-center gap-2">
                                    <span className="font-medium">
                                        {knownAddresses[tx.owner].name}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center h-full">
                                    <WalletAddress 
                                        address={tx.owner} 
                                        className="font-medium"
                                        chain={chain}
                                    />
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {formatTimeAgo(tx.blockUnixTime * 1000)}
                            </span>
                        </TableCell>
                        <TableCell>
                            <a
                                href={`https://solscan.io/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default TransactionsTab;
