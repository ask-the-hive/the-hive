'use client';

import React, { useMemo } from 'react';
import { CheckCircle, ArrowUpRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SwapSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: {
    mode: 'buy' | 'sell' | 'withdraw';
    inputToken: string;
    outputToken: string;
    outputAmount: string;
  };
  txHash?: string;
  chain?: 'solana' | 'bsc' | 'base';
}

const SwapSuccessModal: React.FC<SwapSuccessModalProps> = ({
  isOpen,
  onClose,
  swapData,
  txHash,
  chain = 'solana',
}) => {
  const { mode, inputToken, outputToken, outputAmount } = swapData;

  const title = useMemo(() => {
    if (mode === 'withdraw') {
      return `${outputAmount} ${outputToken} successful!`;
    }
    const action = mode === 'buy' ? 'Buy' : 'Sell';

    return `${action} ${inputToken} for ${outputToken} successful!`;
  }, [mode, inputToken, outputToken, outputAmount]);

  const explorerUrl = useMemo(() => {
    if (!txHash) return null;

    switch (chain) {
      case 'solana':
        return `https://solscan.io/tx/${txHash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      default:
        return `https://solscan.io/tx/${txHash}`;
    }
  }, [txHash, chain]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Transaction Successful!</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">
              {mode === 'withdraw' ? (
                <>
                  You withdrew{' '}
                  <span className="font-medium text-foreground">
                    {outputAmount} {outputToken}
                  </span>{' '}
                  from your lending position
                </>
              ) : (
                <>
                  You received{' '}
                  <span className="font-medium text-foreground">
                    {outputAmount} {outputToken}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Explorer Link */}
        {explorerUrl && (
          <div className="px-6 pb-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
            >
              View on Explorer
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Close Button */}
        <div className="p-6 pt-0">
          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapSuccessModal;
