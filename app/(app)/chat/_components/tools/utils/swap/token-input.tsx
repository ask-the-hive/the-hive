'use client';

import TokenSelect from '@/app/_components/token-select';
import { Token } from '@/db/types/token';
import React from 'react';
import { cn } from '@/lib/utils';
import TokenBalance from './token-balance';
import { usePrice } from '@/hooks/queries/price';
import {
  Skeleton,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui';
import { Info } from 'lucide-react';
import TokenDisplay from '@/app/_components/token-display';

interface Props {
  label: string;
  amount: string;
  onChange?: (amount: string) => void;
  token: Token | null;
  onChangeToken?: (token: Token | null) => void;
  address?: string;
  tooltip?: string | React.ReactNode;
}

const TokenInput: React.FC<Props> = ({
  label,
  amount,
  onChange,
  token,
  onChangeToken,
  address,
  tooltip,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex flex-col border border-transparent rounded-md p-2 w-full transition-colors bg-neutral-100 dark:bg-neutral-700 gap-2',
          isFocused && 'border-brand-600',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2  mb-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{label}</p>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  {typeof tooltip === 'string' ? <p className="text-sm">{tooltip}</p> : tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {token && address && (
            <TokenBalance
              address={address}
              tokenAddress={token.id}
              tokenSymbol={token.symbol}
              setAmount={onChange}
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
            {token && <TokenInputValue amount={amount} token={token} />}
          </div>
          {onChangeToken ? (
            <TokenSelect value={token} onChange={onChangeToken} />
          ) : (
            token && <TokenDisplay token={token} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export const TokenInputValue = ({ amount, token }: { amount: string; token: Token }) => {
  const { data: price, isLoading: isPriceLoading } = usePrice(token.id);

  if (isPriceLoading) return <Skeleton className="w-16 h-4" />;

  if (!price) return null;

  return (
    <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
      $
      {(price.value * Number(amount)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </p>
  );
};

export default TokenInput;
