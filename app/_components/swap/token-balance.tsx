'use client';

import { Button, Skeleton } from '@/components/ui';
import { useTokenBalance } from '@/hooks';
import { Wallet } from 'lucide-react';
import React from 'react';

interface Props {
  address: string;
  tokenAddress: string;
  tokenSymbol: string;
  setAmount?: (amount: string) => void;
  digits?: number;
}

const TokenBalance: React.FC<Props> = ({
  address,
  tokenAddress,
  tokenSymbol,
  setAmount,
  digits = 2,
}) => {
  const { balance, isLoading } = useTokenBalance(tokenAddress, address);

  if (isLoading) return <Skeleton className="w-16 h-4" />;

   const rawBalance = balance ?? 0;

   const SOL_MINT = 'So11111111111111111111111111111111111111112';
   const SOL_RESERVE = 0.005; // Keep ~0.005 SOL for fees/rent

   const isSol =
     tokenSymbol.toUpperCase() === 'SOL' || tokenAddress === SOL_MINT;

   const spendableBalance = isSol
     ? Math.max(rawBalance - SOL_RESERVE, 0)
     : rawBalance;

  return (
    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
      <Wallet className="w-3 h-3" />
      <p className="text-sm">
        {spendableBalance.toLocaleString(undefined, {
          maximumFractionDigits: digits,
        })}{' '}
        {tokenSymbol}
      </p>
      {setAmount && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-[12px] px-2 py-1 h-fit w-fit"
            onClick={() => setAmount((spendableBalance / 2).toString())}
          >
            Half
          </Button>
          <Button
            variant="outline"
            className="text-[12px] px-2 py-1 h-fit w-fit"
            onClick={() => setAmount(spendableBalance.toString())}
          >
            Max
          </Button>
        </div>
      )}
    </div>
  );
};

export default TokenBalance;
