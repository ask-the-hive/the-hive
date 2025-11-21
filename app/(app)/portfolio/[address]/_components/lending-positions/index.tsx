import React, { useState } from 'react';
import { PiggyBank, Info } from 'lucide-react';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  Button,
  TokenIcon,
} from '@/components/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChain } from '@/app/_contexts/chain-context';
import { LendingPosition } from '@/types/lending-position';
import { formatFiat, formatCrypto, formatCompactNumber, formatUSD } from '@/lib/format';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Portfolio } from '@/services/birdeye/types';
import WithdrawModal from './withdraw-modal';
import SwapSuccessModal from '../swap-success-modal';

interface Props {
  lendingPositions: LendingPosition[] | null;
  portfolio: Portfolio | undefined;
  portfolioLoading: boolean;
  onRefresh: () => void;
}

interface PoolTooltipProps {
  poolData: any;
}

/**
 * Get the website URL for a lending protocol
 */
const getProtocolUrl = (protocol: string | null | undefined): string | null => {
  if (!protocol) return null;

  const normalizedProtocol = protocol.toLowerCase().replace(/[-\s]+/g, '-');

  const protocolUrls: Record<string, string> = {
    'kamino-lend': 'https://kamino.com/lend',
    kamino: 'https://kamino.com/lend',
    'jupiter-lend': 'https://jup.ag/lend',
    jupiter: 'https://jup.ag/lend',
    solend: 'https://solend.fi',
    marginfi: 'https://marginfi.com',
    credix: 'https://credix.finance',
  };

  return protocolUrls[normalizedProtocol] || null;
};

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

const LendingPositions: React.FC<Props> = ({
  lendingPositions,
  portfolio,
  portfolioLoading,
  onRefresh,
}) => {
  const { currentChain } = useChain();
  const [selectedPosition, setSelectedPosition] = useState<LendingPosition | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawSuccessData, setWithdrawSuccessData] = useState<{
    amount: number;
    tokenSymbol: string;
    tx: string;
  } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleWithdraw = (position: LendingPosition) => {
    setSelectedPosition(position);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawSuccess = (data: { amount: number; tokenSymbol: string; tx: string }) => {
    setWithdrawSuccessData(data);
    setIsSuccessModalOpen(true);
    onRefresh();
  };

  if (currentChain !== 'solana') return null;

  // Show skeleton while loading
  if (lendingPositions === null || portfolioLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!lendingPositions?.length) {
    return null; // Don't show anything if no positions
  }

  // Calculate total value of lending positions
  const totalValue = lendingPositions.reduce((sum, pos) => {
    const portfolioToken = portfolio?.items?.find(
      (item) => item.address === pos.token.id || item.symbol === pos.token.symbol,
    );

    // Fallback: calculate from position amount and pool data
    const price = portfolioToken?.priceUsd || 1;
    return sum + pos.amount * price;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-6 h-6" />
          <h2 className="text-xl font-bold">Lending</h2>
        </div>
        {totalValue > 0 && <p className="text-lg font-bold">{formatUSD(totalValue)}</p>}
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>APY</TableHead>
              <TableHead className="hidden md:table-cell">Protocol</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="max-h-96 overflow-y-auto">
            {lendingPositions.map((position, index) => {
              // Find current balance from portfolio
              const portfolioToken = portfolio?.items?.find(
                (item) =>
                  item.address === position.token.id || item.symbol === position.token.symbol,
              );

              const price = portfolioToken?.priceUsd || 0;
              const decimals = portfolioToken?.decimals || position.token.decimals || 6;

              // For lending, the position amount is the deposited amount
              // We can show the current balance from portfolio (which includes accrued interest)
              const depositedAmount = position.amount;

              // Use position amount if portfolio doesn't have balance
              const displayBalanceRaw = (depositedAmount * Math.pow(10, decimals)).toString();

              return (
                <TableRow key={`${position.walletAddress}-${position.token.symbol}-${index}`}>
                  <TableCell>
                    <div className="font-medium flex gap-2 items-center">
                      <TokenIcon
                        src={position.token.logoURI}
                        alt={position.token.name}
                        tokenSymbol={position.token.symbol}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full"
                      />
                      <p>{position.token.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {formatCrypto(displayBalanceRaw, position.token.symbol, decimals)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFiat(displayBalanceRaw, price, decimals)}
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
                      {getProtocolUrl(position.protocol) ? (
                        <Link
                          href={getProtocolUrl(position.protocol)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                        >
                          {capitalizeWords(position.protocol || 'Unknown')}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {capitalizeWords(position.protocol || 'Unknown')}
                        </span>
                      )}
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
                      onClick={() => handleWithdraw(position)}
                      className={cn(
                        '-m-5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200',
                        'dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50',
                      )}
                    >
                      Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {selectedPosition && (
        <WithdrawModal
          position={selectedPosition}
          isOpen={isWithdrawModalOpen}
          onClose={() => {
            setIsWithdrawModalOpen(false);
            setSelectedPosition(null);
          }}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {withdrawSuccessData && (
        <SwapSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setWithdrawSuccessData(null);
          }}
          swapData={{
            mode: 'withdraw',
            inputToken: selectedPosition?.token.symbol || '',
            outputToken: withdrawSuccessData.tokenSymbol,
            outputAmount: withdrawSuccessData.amount.toString(),
          }}
        />
      )}
    </div>
  );
};

export default LendingPositions;
