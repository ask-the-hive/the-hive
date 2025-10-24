import React from 'react';
import { Droplet, Info } from 'lucide-react';
import Image from 'next/image';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  Button,
} from '@/components/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChain } from '@/app/_contexts/chain-context';
import { LiquidStakingPosition } from '@/db/types';
import { formatFiat, formatCrypto, formatCompactNumber, formatUSD } from '@/lib/format';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import { Card } from '@/components/ui/card';
import { useSwapModal } from '../../_contexts/use-swap-modal';
import { cn } from '@/lib/utils';
import { Portfolio } from '@/services/birdeye/types';

interface Props {
  stakingPositions: LiquidStakingPosition[] | null;
  portfolio: Portfolio | undefined;
  portfolioLoading: boolean;
  onRefresh: () => void;
}

interface PoolTooltipProps {
  poolData: any;
}

const PoolTooltip: React.FC<PoolTooltipProps> = ({ poolData }) => {
  return (
    <TooltipContent className="max-w-xs">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="font-medium">APY:</div>
        <div className="text-green-600">{`${poolData.yield?.toFixed(2) || '0.00'}%`}</div>
        <div className="font-medium">TVL:</div>
        <div>{formatCompactNumber(poolData.tvlUsd || 0)}</div>

        {poolData.predictions && (
          <>
            <div className="font-medium">APY Confidence:</div>
            <div className="text-green-600">
              {getConfidenceLabel(poolData.predictions.binnedConfidence)}
            </div>

            <div className="font-medium">Prediction:</div>
            <div>
              {`${poolData.predictions.predictedClass} (${poolData.predictions.predictedProbability}%)`}
            </div>
          </>
        )}

        {poolData.url && (
          <>
            <div className="font-medium">URL:</div>
            <div className="truncate">
              <a
                href={poolData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                {poolData.url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </>
        )}
      </div>
    </TooltipContent>
  );
};

const LiquidityPools: React.FC<Props> = ({
  stakingPositions,
  portfolio,
  portfolioLoading,
  onRefresh,
}) => {
  const { currentChain } = useChain();

  const { onOpen } = useSwapModal();

  const openSell = (tokenAddress: string) => onOpen('sell', tokenAddress, onRefresh, true);

  if (currentChain !== 'solana') return null;

  // Show skeleton while loading
  if (stakingPositions === null || portfolioLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!stakingPositions?.length) {
    return null; // Don't show anything if no positions
  }

  // Calculate total value of liquid staking positions
  const totalValue = stakingPositions.reduce((sum, pos) => {
    const portfolioToken = portfolio?.items?.find(
      (item) => item.address === pos.lstToken.id || item.symbol === pos.lstToken.symbol,
    );
    if (portfolioToken && portfolioToken.valueUsd) {
      return sum + portfolioToken.valueUsd;
    }
    return sum;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-6 h-6" />
          <h2 className="text-xl font-bold">Liquid Staking Positions</h2>
        </div>
        {totalValue > 0 && <p className="text-lg font-bold">{formatUSD(totalValue)}</p>}
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Yield Earned</TableHead>
              <TableHead>APY</TableHead>
              <TableHead className="hidden md:table-cell">Protocol</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="max-h-96 overflow-y-auto">
            {stakingPositions.map((position) => {
              // Find current balance from portfolio
              const portfolioToken = portfolio?.items?.find(
                (item) =>
                  item.address === position.lstToken.id || item.symbol === position.lstToken.symbol,
              );

              const rawBalance = portfolioToken?.balance || '0';
              const price = portfolioToken?.priceUsd || 0;
              const decimals = portfolioToken?.decimals || position.lstToken.decimals || 9;

              // Calculate yield earned (current balance - initial staked amount)
              const currentBalance = parseFloat(rawBalance.toString()) / Math.pow(10, decimals);
              const initialAmount = position.amount;
              const yieldEarned = currentBalance - initialAmount;

              // Convert yield earned back to raw balance format for utilities
              const yieldEarnedRaw = yieldEarned * Math.pow(10, decimals);

              return (
                <TableRow key={position.id}>
                  <TableCell>
                    <div className="font-medium flex gap-2 items-center">
                      {position.lstToken.logoURI ? (
                        <Image
                          src={position.lstToken.logoURI}
                          alt={position.lstToken.name}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                      )}
                      <p>{position.lstToken.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {formatCrypto(rawBalance, position.lstToken.symbol, decimals)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFiat(rawBalance, price, decimals)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className={yieldEarned > 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                        {yieldEarned > 0 ? '+' : ''}
                        {formatCrypto(
                          yieldEarnedRaw.toString(),
                          position.lstToken.symbol,
                          decimals,
                        )}
                      </p>
                      <p
                        className={
                          yieldEarned > 0
                            ? 'text-green-600/70 text-sm'
                            : 'text-sm text-muted-foreground'
                        }
                      >
                        {yieldEarned > 0 ? '+' : ''}
                        {formatFiat(yieldEarnedRaw.toString(), price, decimals)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {`${position.poolData.yield.toFixed(2)}%`}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {capitalizeWords(position.poolData.project || 'Unknown')}
                      </span>
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <PoolTooltip poolData={position.poolData} />
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => openSell(position.lstToken.id)}
                      className={cn(
                        'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200',
                        'dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50',
                      )}
                    >
                      Claim SOL
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default LiquidityPools;
