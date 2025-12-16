'use client';

import React, { useState } from 'react';
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
  const rawSymbol = symbol || token || 'Unknown';
  const formattedSymbol =
    rawSymbol.length > 18 ? `${rawSymbol.slice(0, 6)}…${rawSymbol.slice(-4)}` : rawSymbol;
  const altText = `${rawSymbol || name || 'Unknown'} token logo`;
  const [logoError, setLogoError] = useState(false);

  // Skip extra lookups when a logo is already provided and we don't need price data
  const shouldResolve = !logoURI;
  const { data: tokenAddress } = useResolveAssetSymbolToAddress(shouldResolve ? rawSymbol : '');
  const { data: tokenData, isLoading: isTokenLoading } = useTokenDataByAddress(tokenAddress || '');
  const { data: price, isLoading: isPriceLoading } = usePrice(tokenData?.id || '');

  const resolvedLogoURI = logoURI || tokenData?.logoURI || (tokenData as any)?.logo_uri || '';

  return (
    <Card className="flex items-center justify-between gap-3 p-3 md:p-4 w-full min-w-[210px] md:min-w-[240px] overflow-hidden">
      <div className="flex flex-row items-center gap-2 min-w-0">
        {resolvedLogoURI && !logoError ? (
          <Image
            src={resolvedLogoURI}
            alt={altText}
            width={32}
            height={32}
            className="rounded-full"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">?</span>
          </div>
        )}

        <span className="text-sm md:text-base font-semibold text-neutral-100 truncate">
          {formattedSymbol}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 min-w-0">
        <div className="flex flex-row items-baseline gap-1">
          <p className="text-sm md:text-base font-semibold">
            {balance > 0 && balance < 0.0001
              ? '≈ 0'
              : balance.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                  minimumFractionDigits: balance === 0 ? 0 : 2,
                })}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            {formattedSymbol}
          </p>
        </div>
        {isTokenLoading || isPriceLoading ? (
          <Skeleton className="w-16 h-3" />
        ) : (
          tokenData &&
          price && (
            <p className="text-xs md:text-sm text-muted-foreground">
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
