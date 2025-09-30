'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SwapSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: {
    mode: 'buy' | 'sell';
    inputToken: string;
    outputToken: string;
    outputAmount: string;
  } | null;
}

const SwapSuccessModal: React.FC<SwapSuccessModalProps> = ({ isOpen, onClose, swapData }) => {
  if (!swapData) return null;

  const { mode, inputToken, outputToken, outputAmount } = swapData;

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
            <p className="text-lg font-semibold">
              {mode === 'buy' ? 'Buy' : 'Sell'} {inputToken} for {outputToken} successful!
            </p>
            <p className="text-sm text-muted-foreground">
              You received{' '}
              <span className="font-medium text-foreground">
                {outputAmount} {outputToken}
              </span>
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 pt-0">
          <Button onClick={onClose} className="w-full" variant="default">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapSuccessModal;
