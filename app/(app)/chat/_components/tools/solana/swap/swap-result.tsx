import React, { useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { usePrice } from '@/hooks';
import { CheckCircle } from 'lucide-react';
import type { SolanaTradeResultBodyType } from '@/ai';
import { useChain } from '@/app/_contexts/chain-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SwapResultCardProps {
  result: SolanaTradeResultBodyType;
}

const SwapResultCard: React.FC<SwapResultCardProps> = ({ result }) => {
  const { inputAmount, outputAmount, inputToken, outputToken, outputTokenAddress, transaction } =
    result;
  const { walletAddresses } = useChain();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  // Get token symbols from addresses
  const { data: outputTokenPrice } = usePrice(outputTokenAddress || '');

  const toAmountUSD = useMemo(() => {
    if (!outputAmount || !outputTokenPrice) return null;
    return outputAmount * outputTokenPrice.value;
  }, [outputAmount, outputTokenPrice]);

  const handleViewPortfolio = async () => {
    if (!walletAddresses.solana || isNavigating) return;

    setIsNavigating(true);
    try {
      await router.push(`/portfolio/${walletAddresses.solana}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col items-center space-y-6 py-6 px-6">
        {/* Success Icon */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-lg font-semibold">Swap Successful!</p>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            You swapped{' '}
            <span className="font-medium text-foreground">
              {inputAmount ?? '--'} {inputToken}
            </span>{' '}
          </p>
          <p className="text-lg text-muted-foreground">
            for{' '}
            <span className="font-medium text-foreground">
              {outputAmount ?? '--'} {outputToken}
            </span>{' '}
            {toAmountUSD && (
              <span className="">
                (~$
                {toAmountUSD.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                )
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 mb-6 flex flex-col gap-2 px-4">
        {walletAddresses.solana && (
          <Button
            variant="brand"
            className="w-full"
            onClick={handleViewPortfolio}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'View Portfolio'
            )}
          </Button>
        )}
        {transaction && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(`https://solscan.io/tx/${transaction}`, '_blank')}
          >
            View Transaction
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SwapResultCard;
