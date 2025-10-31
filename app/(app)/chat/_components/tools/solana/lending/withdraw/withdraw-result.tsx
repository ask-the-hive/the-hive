import React from 'react';
import { Card } from '@/components/ui';
import { CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  amount: number;
  tokenSymbol: string;
  yieldEarned?: number;
}

const WithdrawResult: React.FC<Props> = ({ amount, tokenSymbol, yieldEarned = 0 }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Successfully withdrew {amount} {tokenSymbol}!
        </p>
      </div>

      <Card className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <p className="text-xl font-semibold text-neutral-600 dark:text-neutral-400">
                {amount} {tokenSymbol}
              </p>
              <p className="text-gray-600 text-sm dark:text-gray-400">Amount Withdrawn</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-semibold text-green-600">${yieldEarned.toFixed(2)}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Yield Earned</p>
            </div>
          </div>

          {yieldEarned > 0 && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Yield Summary
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You earned ${yieldEarned.toFixed(2)} in interest during your lending period.
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your {tokenSymbol} tokens are now back in your wallet and ready to use.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WithdrawResult;
