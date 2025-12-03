'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { TokenIcon } from '@/components/ui/token-icon';

import { Token } from '@/db/types';

interface Props {
  token: Token;
}

const TokenDisplay: React.FC<Props> = ({ token }) => {
  return (
    <div className="w-fit shrink-0 flex items-center bg-neutral-200 dark:bg-neutral-700 rounded-md px-2 py-1 gap-2 cursor-pointer transition-colors duration-200">
      <TokenIcon
        src={token.logoURI}
        alt={token.name}
        tokenSymbol={token.symbol}
        width={24}
        height={24}
        className="w-6 h-6 rounded-full"
      />
      <p className={cn('text-xs font-bold', 'opacity-100')}>{token.symbol}</p>
    </div>
  );
};

export default TokenDisplay;
