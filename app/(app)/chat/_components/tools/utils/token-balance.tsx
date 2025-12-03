'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { usePrice } from '@/hooks/queries/price';
import { Skeleton } from '@/components/ui';
import { useTokenDataByAddress } from '@/hooks/queries/token';
import { useResolveAssetSymbolToAddress } from '@/hooks/queries/token/use-resolve-asset-symbol-to-address';
import Image from 'next/image';

interface Props {
  balance: number;
  logoURI?: string;
  symbol?: string;
  token?: string;
  name?: string;
}

const TokenBalance: React.FC<Props> = ({ balance, logoURI, symbol, token, name }) => {
  // Use token as symbol if symbol is not provided
  const displaySymbol = symbol || token || 'Unknown';
  // Use name as fallback for the alt text
  const altText = `${displaySymbol || name || 'Unknown'} token logo`;

  const { data: tokenAddress } = useResolveAssetSymbolToAddress(displaySymbol);
  const { data: tokenData, isLoading: isTokenLoading } = useTokenDataByAddress(tokenAddress || '');
  const { data: price, isLoading: isPriceLoading } = usePrice(tokenData?.id || '');
  // The balance is already in the correct format, no need to divide by 10^decimals

  return (
    <Card className="flex items-center justify-between gap-2 p-4">
      <div className="flex flex-row items-center gap-2">
        {logoURI ? (
          <Image src={logoURI} alt={altText} width={32} height={32} className="rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              {displaySymbol?.toUpperCase()}
            </span>
          </div>
        )}

        <span className="text-lg font-medium text-muted-foreground">{displaySymbol}</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex flex-row items-end gap-2">
          <p className="text-md font-medium">
            {balance.toLocaleString(undefined, {
              maximumFractionDigits: 4,
              minimumFractionDigits: 4,
            })}
          </p>
          <p className="text-md text-muted-foreground">{displaySymbol}</p>
        </div>
        {isTokenLoading || isPriceLoading ? (
          <Skeleton className="w-16 h-4" />
        ) : (
          tokenData &&
          price && (
            <p className="text-md text-muted-foreground">
              $
              {(price.value * Number(balance)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )
        )}
      </div>
    </Card>
  );
};

export default TokenBalance;
