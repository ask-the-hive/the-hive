import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ExternalLink, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { capitalizeWords, getConfidenceLabel } from '@/lib/string-utils';
import type { LiquidStakingYieldsPoolData } from '@/ai';

interface Props {
  pool: LiquidStakingYieldsPoolData | null;
  isOpen: boolean;
  onClose: () => void;
}

const PoolDetailsModal: React.FC<Props> = ({ pool, isOpen, onClose }) => {
  if (!pool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Image
              src={pool.tokenData?.logoURI || ''}
              alt={pool.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl truncate">{pool.name}</DialogTitle>
              <DialogDescription className="text-sm">
                {capitalizeWords(pool.project)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current APY</p>
                <p className="text-lg sm:text-xl font-semibold text-green-600">
                  {pool.yield.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value Locked</p>
                <p className="text-lg sm:text-xl font-semibold text-blue-600">
                  ${(pool.tvlUsd / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>

          {/* APY Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">APY Breakdown</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Base APY</p>
                <p className="text-sm sm:text-lg font-semibold">{pool.apyBase.toFixed(2)}%</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reward APY</p>
                <p className="text-sm sm:text-lg font-semibold">{pool.apyReward.toFixed(2)}%</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total APY</p>
                <p className="text-sm sm:text-lg font-semibold text-green-600">
                  {pool.yield.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Predictions */}
          {pool.predictions && (
            <div className="space-y-3">
              <h3 className="font-semibold text-base sm:text-lg">APY Predictions</h3>
              <div className="p-3 sm:p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">DeFiLlama Prediction</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">
                      Predicted Class
                    </p>
                    <p className="font-semibold text-xs md:text-base">
                      {pool.predictions.predictedClass}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">
                      Confidence
                    </p>
                    <p className="font-semibold text-xs md:text-base">
                      {pool.predictions.predictedProbability}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">
                      Model Confidence
                    </p>
                    <p className="font-semibold text-xs md:text-base">
                      {getConfidenceLabel(pool.predictions.binnedConfidence)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  DeFiLlama&apos;s confidence level in their 4-week APY prediction, based on
                  historical data accuracy and market conditions.
                </p>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">How It Works</h3>
            <div className="p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Stake Your SOL</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Swap your SOL tokens for {pool.symbol} to stake into the{' '}
                      {capitalizeWords(pool.project)} liquid staking protocol
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Receive LST Tokens
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Get {pool.symbol} tokens representing your staked SOL position
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Earn Rewards Automatically
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your {pool.symbol} tokens automatically accrue staking rewards at{' '}
                      {pool.yield.toFixed(2)}% APY
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                      4
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Maintain Liquidity
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Trade, lend, or use your {pool.symbol} tokens in DeFi while earning staking
                      rewards
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">Additional Details</h3>
            <div className="space-y-2 text-sm">
              {pool.poolMeta && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Description</p>
                  <p className="font-medium break-words">{pool.poolMeta}</p>
                </div>
              )}
              {pool.url && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Website</p>
                  <a
                    href={pool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                  >
                    Visit Website <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              )}
              {pool.rewardTokens && pool.rewardTokens.length > 0 && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Reward Tokens</p>
                  <p className="font-medium break-words">{pool.rewardTokens.join(', ')}</p>
                </div>
              )}
              {pool.underlyingTokens && pool.underlyingTokens.length > 0 && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Underlying Tokens</p>
                  <p className="font-medium break-words">{pool.underlyingTokens.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoolDetailsModal;
