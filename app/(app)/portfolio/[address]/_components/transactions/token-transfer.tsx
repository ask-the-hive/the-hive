'use client';

import React from 'react';

import { Skeleton, TokenIcon } from '@/components/ui';

import { useTokenDataByAddress } from '@/hooks';
import { useChain } from '@/app/_contexts/chain-context';

import { cn } from '@/lib/utils';
import { formatFiat } from '@/lib/format';

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

const TokenTransfer: React.FC<Props> = ({ tokenTransfer, address }) => {
  const { currentChain } = useChain();
  const isSolana = currentChain === 'solana';

  // Always call the hook, but only use its result when needed
  const { data: solanaTokenData, isLoading: isSolanaTokenLoading } = useTokenDataByAddress(
    tokenTransfer.mint || '',
  );

  // For Solana transfers
  if (isSolana && tokenTransfer.mint) {
    if (isSolanaTokenLoading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Skeleton className="w-10 h-3 rounded-full" />
              <Skeleton className="w-16 h-3 rounded-full" />
            </div>
            <Skeleton className="w-24 h-3 rounded-full" />
          </div>
        </div>
      );
    }

    const amount = tokenTransfer.tokenAmount || 0;
    const isOutgoing = tokenTransfer.toUserAccount !== address;

    // Hide unknown LP tokens
    if (!solanaTokenData?.symbol || solanaTokenData.symbol === 'Unknown') {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <TokenIcon
          src={solanaTokenData?.logoURI}
          alt={solanaTokenData?.name || 'Token'}
          tokenSymbol={solanaTokenData?.symbol}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{solanaTokenData?.symbol || 'Unknown'}</span>
            <span
              className={cn('text-sm font-medium', isOutgoing ? 'text-red-500' : 'text-green-500')}
            >
              {isOutgoing ? '-' : '+'}
              {formatFiat(Math.abs(amount), 1, 0)}
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
      : tokenTransfer.token.logo;

    return (
      <div className="flex items-center gap-2">
        <TokenIcon
          src={logoUrl}
          alt={tokenTransfer.token.name}
          tokenSymbol={tokenTransfer.token.symbol}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{tokenTransfer.token.symbol}</span>
            <span
              className={cn('text-sm font-medium', isOutgoing ? 'text-red-500' : 'text-green-500')}
            >
              {isOutgoing ? '-' : '+'}
              {formatFiat(Math.abs(amount), 1, 0)}
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
