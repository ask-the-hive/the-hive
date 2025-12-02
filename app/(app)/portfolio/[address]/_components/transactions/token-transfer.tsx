'use client';

import React, { useState } from 'react';

import { Skeleton } from '@/components/ui';

import { useTokenDataByAddress } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';

import { cn } from '@/lib/utils';

// Generic token transfer interface that works for both Solana and BSC
interface GenericTokenTransfer {
  // Solana specific
  mint?: string;
  tokenAmount?: number;
  toUserAccount?: string | null;
  // BSC specific
  token?: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logo?: string;
  };
  amount?: number;
  from?: string;
  to?: string;
}

interface Props {
  tokenTransfer: GenericTokenTransfer;
  address?: string;
}

const DEFAULT_FALLBACK = 'https://www.birdeye.so/images/unknown-token-icon.svg';

const TokenTransfer: React.FC<Props> = ({ tokenTransfer, address }) => {
  const { currentChain } = useChain();
  const isSolana = currentChain === 'solana';
  const [imgError, setImgError] = useState(false);

  // Always call the hook, but only use its result when needed
  const { data: solanaTokenData, isLoading: isSolanaTokenLoading } = useTokenDataByAddress(
    tokenTransfer.mint || '',
  );

  // For Solana transfers
  if (isSolana && tokenTransfer.mint) {
    if (isSolanaTokenLoading) return <Skeleton className="w-8 h-4 rounded-full" />;

    const amount = tokenTransfer.tokenAmount || 0;
    const isOutgoing = tokenTransfer.toUserAccount !== address;

    // Hide unknown LP tokens
    if (!solanaTokenData?.symbol || solanaTokenData.symbol === 'Unknown') {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <img
          src={imgError ? DEFAULT_FALLBACK : solanaTokenData?.logoURI || DEFAULT_FALLBACK}
          onError={() => setImgError(true)}
          className={cn('w-6 h-6 rounded-full', imgError && 'opacity-50')}
          alt={solanaTokenData?.name || 'Token'}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{solanaTokenData?.symbol || 'Unknown'}</span>
            <span
              className={cn('text-sm font-medium', isOutgoing ? 'text-red-500' : 'text-green-500')}
            >
              {isOutgoing ? '-' : '+'}
              {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {solanaTokenData?.name || 'Unknown Token'}
          </span>
        </div>
      </div>
    );
  }

  // For BSC/Base transfers
  if (tokenTransfer.token) {
    const amount = tokenTransfer.amount || 0;
    const isOutgoing = tokenTransfer.from?.toLowerCase() === address?.toLowerCase();
    const isBaseToken = tokenTransfer.token.symbol.toUpperCase() === 'BASE';
    const logoUrl = isBaseToken
      ? 'https://basescan.org/assets/base/images/svg/empty-token.svg?v=25.4.2.0'
      : tokenTransfer.token.logo || DEFAULT_FALLBACK;

    return (
      <div className="flex items-center gap-2">
        <img
          src={imgError ? DEFAULT_FALLBACK : logoUrl}
          onError={() => setImgError(true)}
          className={cn('w-6 h-6 rounded-full', imgError && 'opacity-50')}
          alt={tokenTransfer.token.name}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{tokenTransfer.token.symbol}</span>
            <span
              className={cn('text-sm font-medium', isOutgoing ? 'text-red-500' : 'text-green-500')}
            >
              {isOutgoing ? '-' : '+'}
              {Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{tokenTransfer.token.name}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default TokenTransfer;
