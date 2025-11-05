import React, { useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import PoolDetailsModal from './staking/pool-details-modal';
import VarApyTooltip from '@/components/var-apy-tooltip';
import type { LiquidStakingYieldsPoolData } from '@/ai';
import type { LendingYieldsPoolData } from '@/ai/solana/actions/lending/lending-yields/schema';

interface Props {
  poolData: LiquidStakingYieldsPoolData | LendingYieldsPoolData;
  outputAmount?: number;
  outputTokenPrice?: number;
  actionType?: 'staking' | 'lending';
}

const PoolEarningPotential: React.FC<Props> = ({
  poolData,
  outputAmount,
  outputTokenPrice,
  actionType = 'staking',
}) => {
  const [selectedTimespan, setSelectedTimespan] = useState<number>(3);
  const preHoverTimespanRef = useRef<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProtocolDetailsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsModalOpen(true);
  };

  // Calculate yield earnings based on current timespan
  const yieldEarnings = useMemo(() => {
    if (!outputAmount || !outputTokenPrice) return 0;
    return ((outputAmount * outputTokenPrice * poolData.yield) / 100) * (selectedTimespan / 12);
  }, [outputAmount, outputTokenPrice, poolData.yield, selectedTimespan]);

  if (!poolData.tokenData) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-3 w-full">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Earning Potential
        </p>
        <Button variant="outline" size="sm" onClick={handleProtocolDetailsClick}>
          Protocol Details
        </Button>
      </div>
      <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-900/20 rounded-lg border">
        <div className="flex items-end justify-between w-full gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Image
              src={poolData.tokenData?.logoURI || ''}
              alt={poolData.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
            <h3 className="font-semibold text-lg">{poolData.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg text-green-600 dark:text-green-400">
              {poolData.yield.toFixed(2)}%
            </p>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">APY</p>
              <VarApyTooltip size="xs" />
            </div>
          </div>
        </div>

        {/* Timespan cards and yield calculator */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            {[3, 6, 12, 24].map((months) => (
              <div
                key={months}
                className={cn(
                  'box-border px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 border',
                  selectedTimespan === months
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white border-transparent',
                )}
                onMouseEnter={() => {
                  if (preHoverTimespanRef.current === null) {
                    preHoverTimespanRef.current = selectedTimespan;
                  }
                  setSelectedTimespan(months);
                }}
                onMouseLeave={() => {
                  if (preHoverTimespanRef.current !== null) {
                    setSelectedTimespan(preHoverTimespanRef.current);
                    preHoverTimespanRef.current = null;
                  }
                }}
                onClick={() => {
                  preHoverTimespanRef.current = null;
                  setSelectedTimespan(months);
                }}
              >
                {months}M
              </div>
            ))}
          </div>

          <div className="max-w-xs bg-brand-500/10 rounded-full px-3 py-2 text-center">
            <p
              className={cn(
                'font-medium',
                yieldEarnings > 0
                  ? 'text-brand-600 dark:text-brand-600 text-lg '
                  : 'text-gray-900 dark:text-gray-100 text-sm',
              )}
            >
              {yieldEarnings > 0 ? `+$${yieldEarnings.toFixed(2)}` : 'Projected yield'}
            </p>
          </div>
        </div>
      </div>

      <PoolDetailsModal
        pool={poolData}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variant={actionType}
      />
    </div>
  );
};

export default PoolEarningPotential;
