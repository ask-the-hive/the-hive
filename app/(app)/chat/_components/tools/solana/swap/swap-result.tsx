import React from 'react';
import { Card } from '@/components/ui';
import { useTokenDataByAddress } from '@/hooks';
import type { SolanaTradeResultBodyType } from '@/ai';

interface SwapResultCardProps {
  result: SolanaTradeResultBodyType;
}

const SwapResultCard: React.FC<SwapResultCardProps> = ({ result }) => {
  const { inputAmount, inputToken, outputToken, transaction } = result;

  // Get token symbols from addresses
  const { data: inputTokenData } = useTokenDataByAddress(inputToken);
  const { data: outputTokenData } = useTokenDataByAddress(outputToken);

  const inputSymbol = inputTokenData?.symbol || inputToken;
  const outputSymbol = outputTokenData?.symbol || outputToken;

  return (
    <Card className="p-6 my-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 dark:text-green-200">Swap Successful!</h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Swapped {inputAmount} {inputSymbol} for {outputSymbol}
          </p>
          {transaction && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Transaction: {transaction}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SwapResultCard;
