'use client';

import TokenSelect from '@/app/_components/token-select';
import { Token } from '@/db/types/token';
import React from 'react';
import { cn } from '@/lib/utils';
import TokenBalance from './token-balance';
import TokenBalanceFromAmount from './token-balance-from-amount';
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
  useBalanceFromAmount?: boolean;
  availableBalance?: number;
}

const TokenInput: React.FC<Props> = ({
  label,
  amount,
  onChange,
  token,
  onChangeToken,
  address,
  tooltip,
  useBalanceFromAmount = false,
  availableBalance,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex flex-col border-2 border-transparent rounded-xl p-4 w-full transition-all duration-200 bg-neutral-100 dark:bg-neutral-500/50 gap-3',
          isFocused && 'border-brand-600 bg-white',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{label}</p>
            {tooltip && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  {typeof tooltip === 'string' ? <p className="text-sm">{tooltip}</p> : tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {token && address && !useBalanceFromAmount && (
            <TokenBalance
              address={address}
              tokenAddress={token.id}
              tokenSymbol={token.symbol}
              setAmount={onChange}
            />
          )}
          {token && useBalanceFromAmount && availableBalance !== undefined && (
            <TokenBalanceFromAmount
              amount={availableBalance}
              tokenSymbol={token.symbol}
              setAmount={onChange}
            />
          )}
        </div>
        <div className={cn('flex items-end justify-between w-full gap-3')}>
          <div className="flex-1 min-w-0">
            <input
              type="number"
              value={amount}
              onChange={(e) => onChange && onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-transparent border-none outline-none text-2xl font-bold text-gray-900 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-neutral-300 dark:placeholder:text-neutral-400"
              disabled={!onChange}
              placeholder="0"
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

  if (isPriceLoading) return <Skeleton className="w-20 h-5 mt-1" />;

  if (!price) return null;

  const calculatedValue = price.value * Number(amount);

  if (isNaN(calculatedValue)) {
    console.error('TokenInputValue - NaN calculation:', {
      priceValue: price.value,
      amount: amount,
      amountAsNumber: Number(amount),
    });
    return null;
  }

  return (
    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
      ≈ $
      {calculatedValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </p>
  );
};

export default TokenInput;
