'use client';

import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
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
}

const SwapSuccessModal: React.FC<SwapSuccessModalProps> = ({ isOpen, onClose, swapData }) => {
  const { mode, inputToken, outputToken, outputAmount } = swapData;

  const title = useMemo(() => {
    if (mode === 'withdraw') {
      return `${outputAmount} ${outputToken} successful!`;
    }
    const action = mode === 'buy' ? 'Buy' : 'Sell';

    return `${action} ${inputToken} for ${outputToken} successful!`;
  }, [mode, inputToken, outputToken, outputAmount]);

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
