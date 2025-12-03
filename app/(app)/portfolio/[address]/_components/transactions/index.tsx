'use client';

import React from 'react';

import { ArrowLeftRight } from 'lucide-react';

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
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
  if (source === 'JUPITER_LEND') return 'Jupiter Lend';
  if (source === 'JUPITER' || source === 'JUPITER_SWAP') return 'Jupiter Swap';

  // Default formatting for other sources
  return source
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const isJupiterLendTx = (tx: any) =>
  tx?.instructions?.some(
    (ix: any) => ix?.programId === 'jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9',
  );
const isKaminoLendTx = (tx: any) =>
  tx?.source?.toUpperCase?.().includes('KAMINO') || tx?.type === 'REFRESH_OBLIGATION';

const getDisplayType = (tx: any, address: string) => {
  if (isJupiterLendTx(tx)) {
    const hasInflow = tx?.tokenTransfers?.some(
      (t: any) => t?.toUserAccount && t.toUserAccount === address,
    );
    const hasOutflow = tx?.tokenTransfers?.some(
      (t: any) => t?.toUserAccount && t.toUserAccount !== address,
    );
    if (hasInflow && !hasOutflow) return 'Lend Withdraw';
    if (hasOutflow && !hasInflow) return 'Lend Deposit';
    return 'Lend';
  }

  if (isKaminoLendTx(tx)) {
    const hasInflow = tx?.tokenTransfers?.some(
      (t: any) => t?.toUserAccount && t.toUserAccount === address,
    );
    const hasOutflow = tx?.tokenTransfers?.some(
      (t: any) => t?.toUserAccount && t.toUserAccount !== address,
    );
    if (hasInflow && !hasOutflow) return 'Lend Withdraw';
    if (hasOutflow && !hasInflow) return 'Lend Deposit';
    return 'Lend';
  }

  // Heuristic for Jupiter swap: source marks JUPITER and unknown type
  if (tx?.source === 'JUPITER' && tx?.type === 'UNKNOWN') {
    return 'Swap';
  }

  return tx.type
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const Transactions: React.FC<Props> = ({ address }) => {
  const { currentChain, walletAddresses } = useChain();

  // Use the appropriate address for the current chain
  const chainAddress =
    currentChain === 'solana'
      ? walletAddresses.solana || address
      : currentChain === 'bsc'
        ? walletAddresses.bsc || address
        : walletAddresses.base || address;

  const { data: transactions, isLoading } = useTransactions(chainAddress, currentChain);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="w-6 h-6" />
        <h2 className="text-xl font-bold">Transactions</h2>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : transactions && transactions.length > 0 ? (
        <Card>
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
              {transactions.map((transaction) => (
                <TableRow key={transaction.signature}>
                  <TableCell>
                    <TransactionHash
                      hash={transaction.signature}
                      hideTransactionText
                      chain={currentChain}
                    />
                  </TableCell>
                  <TableCell>{getDisplayType(transaction, chainAddress)}</TableCell>
                  <TableCell>
                    {isJupiterLendTx(transaction)
                      ? 'Jupiter Lend'
                      : isKaminoLendTx(transaction)
                        ? 'Kamino Lend'
                        : formatSource(transaction.source)}
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
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Transactions;
