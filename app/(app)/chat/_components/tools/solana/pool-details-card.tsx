import React from 'react';
import { Card, Button, TokenIcon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import VarApyTooltip from '@/components/var-apy-tooltip';
import posthog from 'posthog-js';

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
  projectLogoURI?: string | null;
  predictions?: {
    binnedConfidence: number | string;
  };
}

interface PoolDetailsCardProps<T extends PoolData> {
  pool: T;
  index: number;
  primaryActionLabel: string;
  onPrimaryAction: (pool: T) => void | Promise<void>;
  onOpenDetails: (pool: T) => void;
  disabled?: boolean;
  highlightIndex?: number;
}

function PoolDetailsCard<T extends PoolData>({
  pool,
  index,
  primaryActionLabel,
  onPrimaryAction,
  onOpenDetails,
  disabled = false,
  highlightIndex = 0,
}: PoolDetailsCardProps<T>) {
  const handleOpenDetails = (event: React.MouseEvent) => {
    event.stopPropagation();
    posthog.capture('pool_details_card_opened', {
      pool_name: pool.name,
      pool_project: pool.project,
    });
    onOpenDetails(pool);
  };

  const handlePrimaryAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    posthog.capture('pool_details_primary_action_clicked', {
      pool_name: pool.name,
      pool_project: pool.project,
      action: primaryActionLabel,
    });
    onPrimaryAction(pool);
  };
  return (
    <Card
      key={`${pool.name}-${pool.project}-${index}`}
      className={cn(
        'group relative flex flex-col gap-2 items-center p-4 overflow-hidden transition-colors duration-150',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-brand-600/50 dark:hover:border-brand-600/50',
        index === highlightIndex &&
          'border-brand-600 dark:border-brand-600 !shadow-[0_0_4px_rgba(234,179,8,0.25)] dark:!shadow-[0_0_4px_rgba(234,179,8,0.25)]',
      )}
      onClick={(e) => !disabled && handleOpenDetails(e)}
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
              src={pool.projectLogoURI || undefined}
              alt={pool.project || ''}
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
              <div className="flex items-center gap-1">
                <TokenIcon
                  src={pool.projectLogoURI || undefined}
                  alt={pool.project || ''}
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

      <div
        className={cn(
          'gap-2 text-sm mt-4',
          pool.predictions ? 'grid grid-cols-2' : 'flex justify-center',
        )}
      >
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

      <div className="mt-4 w-full md:bg-white md:dark:bg-neutral-800 md:border-t md:border-gray-200 md:dark:border-gray-700 md:p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="brand"
            size="sm"
            className="w-full"
            onClick={(e) => !disabled && handlePrimaryAction(e)}
            disabled={disabled}
          >
            {primaryActionLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => !disabled && handleOpenDetails(e)}
            disabled={disabled}
          >
            More details
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default PoolDetailsCard;
