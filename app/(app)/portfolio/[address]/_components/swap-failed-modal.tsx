'use client';

import React from 'react';
import { XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SwapFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: {
    mode: 'buy' | 'sell';
    inputToken: string;
    outputToken: string;
    error?: string;
  } | null;
}

const SwapFailedModal: React.FC<SwapFailedModalProps> = ({ isOpen, onClose, swapData }) => {
  if (!swapData) return null;

  const { mode, inputToken, outputToken, error } = swapData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Transaction Failed</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              {mode === 'buy' ? 'Buy' : 'Sell'} {inputToken} for {outputToken} failed
            </p>
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
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

export default SwapFailedModal;
