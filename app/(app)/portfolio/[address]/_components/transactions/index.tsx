"use client";

import React from 'react'

import { ArrowLeftRight } from 'lucide-react';

import {
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui';

import TransactionHash from '@/app/_components/transaction-hash';

import TokenTransfer from './token-transfer';
import { useTransactions } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';

interface Props {
    address: string;
}

// Custom formatting for special sources
const formatSource = (source: string): string => {
    if (source === 'PANCAKESWAP') return 'PancakeSwap';
    
    // Default formatting for other sources
    return source.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
};

const Transactions: React.FC<Props> = ({ address }) => {
    const { currentChain, walletAddresses } = useChain();
    
    // Use the appropriate address for the current chain
    const chainAddress = currentChain === 'solana' 
        ? walletAddresses.solana || address 
        : walletAddresses.bsc || address;
    
    const { data: transactions, isLoading } = useTransactions(chainAddress, currentChain);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <ArrowLeftRight
                    className="w-4 h-4"
                />
                <h2 className="text-lg font-bold">Transactions</h2>
            </div>
            <div className="border rounded-md p-2">
                {isLoading ? (
                    <Skeleton
                        className="h-96 w-full"
                    />
                ) : (
                    transactions && transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tx Hash</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Balance Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="max-h-96 overflow-y-hidden">
                                {
                                    transactions.map((transaction) => (
                                        <TableRow key={transaction.signature}>
                                            <TableCell>
                                                <TransactionHash
                                                    hash={transaction.signature}
                                                    hideTransactionText
                                                    chain={currentChain}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {transaction.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                            </TableCell>
                                            <TableCell>
                                                {formatSource(transaction.source)}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.tokenTransfers?.map((tokenTransfer, index) => (
                                                    <TokenTransfer
                                                        key={index}
                                                        tokenTransfer={tokenTransfer}
                                                        address={chainAddress}
                                                    />
                                                ))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-muted-foreground">
                                No transactions found
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export default Transactions