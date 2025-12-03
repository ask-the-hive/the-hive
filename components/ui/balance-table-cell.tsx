'use client';

import React from 'react';
import { TableCell, Skeleton } from '@/components/ui';
import { usePrice } from '@/hooks/queries/price';
import { formatCrypto, formatFiat } from '@/lib/format';

interface BalanceTableCellProps {
  displayBalanceRaw: string;
  tokenSymbol: string;
  tokenId: string;
  decimals: number;
  portfolioPrice?: number;
  className?: string;
}

/**
 * Universal component to display balance with price fetching fallback
 * Used across portfolio sections (lending, staking, tokens)
 */
export const BalanceTableCell: React.FC<BalanceTableCellProps> = ({
  displayBalanceRaw,
  tokenSymbol,
  tokenId,
  decimals,
  portfolioPrice,
  className,
}) => {
  // Fetch price if not available from portfolio or if it's 0
  const shouldFetchPrice = !portfolioPrice || portfolioPrice === 0;
  const { data: fetchedPrice, isLoading: isPriceLoading } = usePrice(
    shouldFetchPrice ? tokenId : '',
  );

  const finalPrice =
    portfolioPrice && portfolioPrice > 0 ? portfolioPrice : fetchedPrice?.value || 0;

  return (
    <TableCell className={className}>
      <div className="flex flex-col">
        <p className="font-medium">{formatCrypto(displayBalanceRaw, tokenSymbol, decimals)}</p>
        {isPriceLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {formatFiat(displayBalanceRaw, finalPrice, decimals)}
          </p>
        )}
      </div>
    </TableCell>
  );
};
