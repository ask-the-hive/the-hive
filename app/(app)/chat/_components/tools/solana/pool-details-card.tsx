import React from 'react';
import { Card, Button, TokenIcon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import VarApyTooltip from '@/components/var-apy-tooltip';

interface PoolData {
  name: string;
  project?: string;
  yield: number;
  tvlUsd: number;
  tokenData?: {
    logoURI?: string;
    symbol?: string;
    id?: string;
  } | null;
  predictions?: {
    binnedConfidence: number | string;
  };
}

interface PoolDetailsCardProps<T extends PoolData> {
  pool: T;
  index: number;
  onClick: (pool: T) => void | Promise<void>;
  onMoreDetailsClick: (pool: T, event: React.MouseEvent) => void;
  disabled?: boolean;
}

const protocolIcons: Record<string, string> = {
  'kamino-lend': 'https://app.kamino.finance/favicon-32x32.png',
  kamino: 'https://app.kamino.finance/favicon-32x32.png',
  'jupiter-lend': 'https://jup.ag/favicon.ico',
  jupiter: 'https://jup.ag/favicon.ico',
  defituna: 'https://metadata.defituna.com/tuna.png',
  'defi-tuna': 'https://metadata.defituna.com/tuna.png',
};

const getProtocolIcon = (project?: string) => {
  if (!project) return undefined;
  const key = project.toLowerCase();
  return protocolIcons[key];
};

function PoolDetailsCard<T extends PoolData>({
  pool,
  index,
  onClick,
  onMoreDetailsClick,
  disabled = false,
}: PoolDetailsCardProps<T>) {
  return (
    <Card
      key={`${pool.name}-${pool.project}-${index}`}
      className={cn(
        'group relative flex flex-col gap-2 items-center p-4 transition-all duration-300 overflow-hidden',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:border-brand-600/50 dark:hover:border-brand-600/50',
        !disabled &&
          index === 1 &&
          'hover:border-brand-600 dark:hover:border-brand-600 !shadow-[0_0_10px_rgba(234,179,8,0.5)] dark:!shadow-[0_0_10px_rgba(234,179,8,0.5)]',
      )}
      onClick={() => !disabled && onClick(pool)}
    >
      <div className="items-center flex-col justify-between gap-2 mb-2 hidden md:flex">
        <div className="flex items-center gap-2">
          <TokenIcon
            src={pool.tokenData?.logoURI}
            alt={pool.name}
            tokenSymbol={pool.tokenData?.symbol}
            width={30}
            height={30}
            className="w-6 h-6 rounded-full"
          />
          <h3 className="font-semibold text-lg">{pool.name}</h3>
        </div>

        {pool.project && (
          <div className="flex items-center gap-2">
            <TokenIcon
              src={getProtocolIcon(pool.project)}
              alt={pool.project}
              tokenSymbol={pool.project}
              width={18}
              height={18}
              className="w-4 h-4 rounded-full"
            />
            <p className="font-medium">{capitalizeWords(pool.project)}</p>
          </div>
        )}
      </div>

      <div className="items-end gap-1 relative hidden md:flex">
        <p className="text-2xl font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>
        <div className="flex items-center gap-1 -top-[3px] relative">
          <p className="text-gray-600 dark:text-gray-400 relative text-xs">APY</p>
          <VarApyTooltip size="xs" />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-between w-full md:hidden">
        <div className="flex items-center justify-center gap-2">
          <TokenIcon
            src={pool.tokenData?.logoURI}
            alt={pool.name}
            tokenSymbol={pool.tokenData?.symbol}
            width={36}
            height={36}
            className="w-8 h-8 rounded-full"
          />
          <div className="items-center flex-col justify-between gap-2">
            <h3 className="font-semibold text-md">{pool.name}</h3>
            {pool.project && (
              <div className="flex items-center gap-2">
                <TokenIcon
                  src={getProtocolIcon(pool.project)}
                  alt={pool.project}
                  tokenSymbol={pool.project}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
                <p className="text-xs font-medium">{capitalizeWords(pool.project)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-1 relative">
          <p className="text-2xl font-semibold text-green-600">{pool.yield.toFixed(2)}%</p>
          <div className="flex items-center gap-1 -top-[3px] relative">
            <p className="text-gray-600 dark:text-gray-400 relative text-xs">APY</p>
            <VarApyTooltip size="xs" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm mt-4">
        {pool.predictions && (
          <div className="flex flex-col items-center">
            <p className="font-semibold text-md">
              {getConfidenceLabel(
                typeof pool.predictions.binnedConfidence === 'number'
                  ? pool.predictions.binnedConfidence
                  : Number(pool.predictions.binnedConfidence),
              )}
            </p>
            <p className="text-gray-600 text-xs dark:text-gray-400">APY Confidence</p>
          </div>
        )}
        <div className="flex flex-col items-center">
          <p className="font-semibold text-md">${(pool.tvlUsd / 1000000).toFixed(1)}M</p>
          <p className="text-gray-600 text-xs dark:text-gray-400">TVL</p>
        </div>
      </div>

      {/* More Details Button - Inline on mobile, absolute on desktop */}
      <div className="mt-4 md:absolute md:bottom-0 md:left-0 md:right-0 md:transform md:translate-y-full md:group-hover:translate-y-0 md:transition-transform md:duration-300 md:ease-in-out md:bg-white md:dark:bg-neutral-800 md:border-t md:border-gray-200 md:dark:border-gray-700 md:p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => !disabled && onMoreDetailsClick(pool, e)}
          disabled={disabled}
        >
          More Details
        </Button>
      </div>
    </Card>
  );
}

export default PoolDetailsCard;
