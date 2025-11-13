'use client';

import { Button } from '@/components/ui';
import { Wallet } from 'lucide-react';
import React from 'react';
import { formatCryptoBalance } from '@/lib/format';

interface Props {
  amount: number;
  tokenSymbol: string;
  setAmount?: (amount: string) => void;
}

const TokenBalanceFromAmount: React.FC<Props> = ({ amount, tokenSymbol, setAmount }) => {
  return (
    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
      <Wallet className="w-3 h-3" />
      <p className="text-xs">{formatCryptoBalance(amount, tokenSymbol)}</p>
      {setAmount && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-[12px] px-2 py-1 h-fit w-fit"
            onClick={() => setAmount((amount / 2).toString())}
          >
            Half
          </Button>
          <Button
            variant="outline"
            className="text-[12px] px-2 py-1 h-fit w-fit"
            onClick={() => setAmount(amount.toString())}
          >
            Max
          </Button>
        </div>
      )}
    </div>
  );
};

export default TokenBalanceFromAmount;
