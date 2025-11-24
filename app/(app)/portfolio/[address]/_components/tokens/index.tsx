'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Coins } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Skeleton,
  Card,
  TokenIcon,
} from '@/components/ui';
import { useSwapModal } from '../../_contexts/use-swap-modal';
import { useChain } from '@/app/_contexts/chain-context';
import { cn } from '@/lib/utils';
import { formatCrypto, formatUSD } from '@/lib/format';
import type { LiquidStakingPosition } from '@/db/types';
import { Portfolio } from '@/services/birdeye/types';

interface Props {
  stakingPositions: LiquidStakingPosition[] | null;
  portfolio: Portfolio | undefined;
  portfolioLoading: boolean;
  onRefresh: () => void;
}

const Tokens: React.FC<Props> = ({ stakingPositions, portfolio, portfolioLoading, onRefresh }) => {
  const router = useRouter();
  const { currentChain } = useChain();

  const { onOpen } = useSwapModal();

  // Helper function to handle successful swaps
  const handleSwapSuccess = () => {
    onRefresh?.();
  };

  // Helper functions to open buy/sell modals
  const openBuy = (tokenAddress: string) => onOpen('buy', tokenAddress, handleSwapSuccess);
  const openSell = (tokenAddress: string) => onOpen('sell', tokenAddress, handleSwapSuccess);
  const startStaking = () => {
    // Navigate to new chat with initial message as query param
    const message = encodeURIComponent('Find me the best staking yields on Solana');
    router.push(`/chat?message=${message}`);
  };

  // Filter out tokens that have liquid staking positions
  const filteredTokens =
    portfolio?.items?.filter((token) => {
      // Basic filters
      const hasBalance = Number(token.balance) > 0;
      const hasRequiredData = token.symbol && token.priceUsd && token.valueUsd;

      if (!hasBalance || !hasRequiredData) return false;

      if ((stakingPositions || []).length === 0) return true;

      // Check if this token has a liquid staking position
      const hasLiquidStakingPosition = (stakingPositions || []).some(
        (position) => position.lstToken.symbol.toLowerCase() === token.symbol.toLowerCase(),
      );

      // Only include tokens that DON'T have liquid staking positions
      return !hasLiquidStakingPosition;
    }) || [];

  // Calculate adjusted portfolio total by subtracting liquid staking token values
  const adjustedPortfolioTotal = useMemo(() => {
    if (!portfolio?.totalUsd || (stakingPositions || []).length === 0) {
      return portfolio?.totalUsd || 0;
    }

    // Calculate total value of liquid staking tokens to subtract
    const liquidStakingTokensValue =
      portfolio.items?.reduce((total, token) => {
        const hasLiquidStakingPosition = (stakingPositions || []).some(
          (position) => position.lstToken.symbol.toLowerCase() === token.symbol.toLowerCase(),
        );

        if (hasLiquidStakingPosition && token.valueUsd) {
          return total + token.valueUsd;
        }

        return total;
      }, 0) || 0;

    return portfolio.totalUsd - liquidStakingTokensValue;
  }, [portfolio?.totalUsd, portfolio?.items, stakingPositions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6" />
          <h2 className="text-xl font-bold">Tokens</h2>
        </div>
        {adjustedPortfolioTotal !== undefined && (
          <p className="text-lg font-bold">{formatUSD(adjustedPortfolioTotal)}</p>
        )}
      </div>
      {portfolioLoading || stakingPositions === null ? (
        <Skeleton className="h-64 w-full" />
      ) : portfolio && portfolio.items && filteredTokens.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Token Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="max-h-96 overflow-y-auto">
              {filteredTokens.map((token) => (
                <TableRow key={token.address}>
                  <TableCell>
                    <div className="font-medium flex gap-2 items-center">
                      <TokenIcon
                        src={token.logoURI}
                        alt={token.name}
                        tokenSymbol={token.symbol}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full"
                      />
                      <p>{token.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {formatCrypto(token.balance, token.symbol, token.decimals)}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatUSD(token.valueUsd)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatUSD(token.priceUsd)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openBuy(token.address)}
                        className={cn(
                          'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200',
                          'dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50',
                        )}
                      >
                        Buy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openSell(token.address)}
                        className={cn(
                          'bg-red-100 hover:bg-red-200 text-red-800 border border-red-200',
                          'dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-800/50',
                        )}
                      >
                        Sell
                      </Button>
                      {currentChain === 'solana' &&
                        token.address === 'So11111111111111111111111111111111111111111' && (
                          <Button
                            size="sm"
                            onClick={startStaking}
                            className={cn(
                              'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200',
                              'dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/50',
                            )}
                          >
                            Stake
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center h-64 border rounded-md">
            <p className="text-muted-foreground">No tokens found</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Tokens;
