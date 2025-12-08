'use client';

import React from 'react';
import Image from 'next/image';
import { ApiV3PoolInfoItem } from '@raydium-io/raydium-sdk-v2';
import TokenBalance from '@/app/_components/swap/token-balance';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  amount: string;
  onChange?: (amount: string) => void;
  pool: ApiV3PoolInfoItem;
  lpMint: string;
  address?: string;
}

const LpTokenInput: React.FC<Props> = ({ label, amount, onChange, pool, lpMint, address }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div
      className={cn(
        'flex flex-col border border-transparent rounded-md p-2 w-full transition-colors bg-neutral-100 dark:bg-neutral-700 gap-2',
        isFocused && 'border-brand-600',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{label}</p>
        {pool && address && (
          <TokenBalance
            address={address}
            tokenAddress={lpMint}
            tokenSymbol={`${pool.mintA.symbol}/${pool.mintB.symbol}`}
            setAmount={onChange}
            digits={4}
          />
        )}
      </div>
      <div className={cn('flex items-center w-full')}>
        <div className="w-full">
          <input
            type="number"
            value={amount}
            onChange={(e) => onChange && onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={!onChange}
            placeholder="0.00"
          />
        </div>
        <div className="w-fit shrink-0 flex items-center rounded-md px-2 py-1 gap-2">
          <Image
            src={pool.mintA.logoURI}
            alt={pool.mintA.name}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
            unoptimized
          />
          <Image
            src={pool.mintB.logoURI}
            alt={pool.mintB.name}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
            unoptimized
          />
          <p className={cn('text-xs font-bold', 'opacity-100')}>
            {`${pool.mintA.symbol}/${pool.mintB.symbol}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LpTokenInput;
