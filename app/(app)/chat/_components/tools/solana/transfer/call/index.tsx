'use client';

import React, { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { Button, Card, Input, Separator, Skeleton } from '@/components/ui';

import LogInButton from '@/app/(app)/_components/log-in-button';

import TokenInput from '../../../utils/swap/token-input';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import { useSendTransaction, useTokenBalance, useTokenDataByAddress } from '@/hooks';

import { buildTransferTx } from './build-tx';

import type { SolanaTransferArgumentsType } from '@/ai';
import type { Token } from '@/db/types';

interface Props {
  args: SolanaTransferArgumentsType;
  toolCallId: string;
}

const TransferCall: React.FC<Props> = ({ args, toolCallId }) => {
  const { addToolResult } = useChat();

  const { wallet, sendTransaction } = useSendTransaction();

  const [amount, setAmount] = useState<string>(args.amount.toString());
  const [token, setToken] = useState<Token | null>(null);
  const [toAddress, setToAddress] = useState<string>(args.to);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(
    args.mint || 'So11111111111111111111111111111111111111112',
  );

  const { balance, isLoading: balanceLoading } = useTokenBalance(
    args.mint || 'So11111111111111111111111111111111111111112',
    wallet?.address || '',
  );

  useEffect(() => {
    if (inputTokenData && !token) {
      setToken(inputTokenData);
    }
  }, [inputTokenData]);

  const onTransfer = async () => {
    if (!wallet || !amount || !toAddress || !token) return;
    setIsTransferring(true);
    const transaction = await buildTransferTx(wallet.address, toAddress, Number(amount), token.id);
    try {
      const tx = await sendTransaction(transaction);
      addToolResult(toolCallId, {
        message: `Successfully transferred ${amount} ${token.symbol} to ${toAddress}.`,
        body: {
          amount: Number(amount),
          recipient: toAddress,
          token: token.symbol,
          transaction: tx,
        },
      });
    } catch (e) {
      addToolResult(toolCallId, {
        message: `Failed to transfer: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (inputTokenLoading) return <Skeleton className="h-48 w-96" />;

  return (
    <Card className="flex flex-col gap-2 p-2">
      <div className="flex flex-col items-center gap-2">
        <TokenInput
          token={token}
          label="Transfer"
          amount={amount}
          onChange={(amount) => {
            setAmount(amount);
          }}
          onChangeToken={(token) => {
            setToken(token);
          }}
          address={wallet?.address}
        />
        <ChevronDown className="w-4 h-4" />
        <Input
          value={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
          placeholder="To address"
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        {wallet ? (
          <Button
            variant="brand"
            onClick={onTransfer}
            disabled={
              isTransferring ||
              balanceLoading ||
              !balance ||
              !token ||
              !amount ||
              Number(amount) <= 0 ||
              !toAddress ||
              Number(amount) > balance
            }
          >
            {balanceLoading
              ? 'Loading...'
              : Number(amount) > balance
                ? 'Insufficient funds'
                : isTransferring
                  ? 'Transferring...'
                  : 'Transfer'}
          </Button>
        ) : (
          <LogInButton />
        )}
        <Button variant="outline">Cancel</Button>
      </div>
    </Card>
  );
};

export default TransferCall;
