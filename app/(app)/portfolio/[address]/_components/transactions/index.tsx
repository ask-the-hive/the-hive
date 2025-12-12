'use client';

import React from 'react';
import { ArrowLeftRight, Download, Upload, Shuffle } from 'lucide-react';
import { Skeleton, Card, Button } from '@/components/ui';
import TransactionHash from '@/app/_components/transaction-hash';
import TokenTransfer from './token-transfer';
import { useTransactions } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';
import { Badge } from '@/components/ui/badge';
import { TokenIcon } from '@/components/ui';
import Image from 'next/image';

interface Props {
  address: string;
}

const formatSource = (source: string): string => {
  if (source === 'PANCAKESWAP') return 'PancakeSwap';
  if (source === 'JUPITER_LEND') return 'Jupiter Lend';
  if (source === 'JUPITER' || source === 'JUPITER_SWAP') return 'Jupiter Swap';

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

const getActionIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('withdraw')) return <Upload className="w-4 h-4 text-muted-foreground" />;
  if (t.includes('deposit')) return <Download className="w-4 h-4 text-muted-foreground" />;
  if (t.includes('swap')) return <Shuffle className="w-4 h-4 text-muted-foreground" />;
  return <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />;
};

const getSourceLogo = (source: string) => {
  const key = source.toLowerCase();
  if (key.includes('jupiter')) return '/logos/jupiter.png';
  if (key.includes('kamino')) return '/logos/kamino.svg';
  if (key.includes('system program')) return 'system';
  return null;
};

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

  const chainAddress =
    currentChain === 'solana'
      ? walletAddresses.solana || address
      : currentChain === 'bsc'
        ? walletAddresses.bsc || address
        : walletAddresses.base || address;

  const { data: transactions, isLoading } = useTransactions(chainAddress, currentChain);

  const orbUrl =
    currentChain === 'solana'
      ? `https://orb.helius.xyz/address/${encodeURIComponent(chainAddress)}`
      : null;

  const orbIcon = (
    <Image src="/logos/orb.svg" alt="Orb Explorer" width={16} height={16} className="w-4 h-4" />
  );

  const filteredTxs =
    transactions?.filter((tx) => (tx.tokenTransfers?.length || 0) > 0).slice(0, 10) || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="w-6 h-6" />
        <h2 className="text-xl font-bold">Transactions</h2>
      </div>
      <Card className="bg-zinc-900/70 border border-zinc-800 shadow-lg shadow-black/30">
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-xs text-muted-foreground">
                Last 10 transactions from your wallet. Click a hash to inspect details.
              </p>
            </div>
            {orbUrl && (
              <Button asChild variant="secondary" size="sm" className="flex items-center gap-2">
                <a href={orbUrl} target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-2">
                    {orbIcon}
                    <span>See all txns on Orb Explorer</span>
                  </span>
                </a>
              </Button>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : filteredTxs.length > 0 ? (
            <div className="flex flex-col divide-y divide-zinc-800">
              {filteredTxs.map((transaction) => {
                const type = getDisplayType(transaction, chainAddress);
                const source = isJupiterLendTx(transaction)
                  ? 'Jupiter Lend'
                  : isKaminoLendTx(transaction)
                    ? 'Kamino Lend'
                    : formatSource(transaction.source);
                const firstTransfer = transaction.tokenTransfers?.[0];
                const orbTxUrl =
                  currentChain === 'solana'
                    ? `https://orb.helius.xyz/tx/${encodeURIComponent(transaction.signature)}`
                    : null;
                return (
                  <div
                    key={transaction.signature}
                    className="grid grid-cols-[140px_160px_1fr_auto_auto] items-center gap-3 py-3"
                  >
                    <div className="flex items-center">
                      {getActionIcon(type)}
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      {getSourceLogo(source) && getSourceLogo(source) !== 'system' && (
                        <TokenIcon
                          src={getSourceLogo(source) || ''}
                          alt={source}
                          tokenSymbol={source}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      {getSourceLogo(source) === 'system' && (
                        <TokenIcon
                        src={getSourceLogo('solana')}
                        alt={'solana'}
                        tokenSymbol={'solana'}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full"
                      />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {firstTransfer && (
                        <TokenTransfer
                          tokenTransfer={firstTransfer}
                          address={chainAddress}
                          compact
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TransactionHash
                        hash={transaction.signature}
                        hideTransactionText
                        chain={currentChain}
                      />
                    </div>
                    <div className="flex items-center">
                      {orbTxUrl && (
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                          <a
                            href={orbTxUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center"
                          >
                            {orbIcon}
                            <span className="text-xs">Orb</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground text-sm">No recent transactions found.</p>
              {orbUrl && (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="mt-2 flex items-center gap-2"
                >
                  <a href={orbUrl} target="_blank" rel="noreferrer">
                    {orbIcon}
                    <span>View in Orb</span>
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
