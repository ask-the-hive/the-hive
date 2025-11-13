import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { useSendTransaction } from '@/hooks/privy/use-send-transaction';
import TokenInput from '@/app/_components/swap/token-input';
import { LendingPosition } from '@/types/lending-position';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import { Loader2 } from 'lucide-react';

const tooltip = (
  <p className="text-xs text-neutral-500 dark:text-neutral-200 max-w-[200px]">
    Withdrawing from your lending position will return your deposited tokens plus any accrued
    interest to your wallet. The transaction will be processed on-chain and may take a few moments
    to confirm.
  </p>
);

interface Props {
  position: LendingPosition;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { amount: number; tokenSymbol: string; tx: string }) => void;
}

const WithdrawModal: React.FC<Props> = ({ position, isOpen, onClose, onSuccess }) => {
  const { wallet, sendTransaction } = useSendTransaction();
  const [amount, setAmount] = useState(position.amount.toString());
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset amount when position changes
  useEffect(() => {
    if (isOpen) {
      setAmount(position.amount.toString());
      setErrorMessage(null);
    }
  }, [position, isOpen]);

  const handleWithdraw = async () => {
    if (!wallet?.address || !amount || Number(amount) <= 0) return;

    setIsWithdrawing(true);
    setErrorMessage(null);

    try {
      // Call backend to build withdraw transaction
      const response = await fetch('/api/lending/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: position.protocol,
          tokenMint: position.token.id,
          tokenSymbol: position.token.symbol,
          amount: Number(amount),
          walletAddress: wallet.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to build withdraw transaction');
      }

      const { transaction: serializedTx } = await response.json();

      // Deserialize transaction
      const transaction = VersionedTransaction.deserialize(Buffer.from(serializedTx, 'base64'));
      console.log(transaction);
      // Send transaction
      const tx = await sendTransaction(transaction);
      console.log(tx);

      // Confirm transaction on-chain
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
      await connection.confirmTransaction(tx, 'confirmed');
      console.log('confirmed');

      // Success - close modal and pass success data
      onSuccess({
        amount: Number(amount),
        tokenSymbol: position.token.symbol,
        tx,
      });
      onClose();
    } catch (error) {
      // Check if user cancelled the transaction
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isUserCancellation =
        errorMsg.toLowerCase().includes('user rejected') ||
        errorMsg.toLowerCase().includes('user cancelled') ||
        errorMsg.toLowerCase().includes('user denied') ||
        errorMsg.toLowerCase().includes('rejected by user') ||
        (error as any)?.code === 4001;

      if (isUserCancellation) {
        onClose();
      } else {
        setErrorMessage('There was an issue submitting the transaction. Please try again.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
    setErrorMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <TokenInput
              token={position.token}
              label="Amount"
              amount={amount}
              onChange={handleAmountChange}
              address={wallet?.address}
              useBalanceFromAmount
              availableBalance={position.amount}
              tooltip={tooltip}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="brand"
              className="w-full"
              onClick={handleWithdraw}
              disabled={
                isWithdrawing ||
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) > position.amount ||
                !!errorMessage
              }
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose} disabled={isWithdrawing}>
              Cancel
            </Button>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
