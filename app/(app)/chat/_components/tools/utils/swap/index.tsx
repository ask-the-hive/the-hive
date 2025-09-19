'use client';

import React, { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { VersionedTransaction } from '@solana/web3.js';

import Decimal from 'decimal.js';

import { Button, Separator } from '@/components/ui';

import LogInButton from '@/app/(app)/_components/log-in-button';

import TokenInput from './token-input';

import { useSendTransaction, useTokenBalance } from '@/hooks';

import { getSwapObj, getQuote } from '@/services/jupiter';

// QuoteResponse type for Jupiter lite API
type QuoteResponse = any;
import type { Token } from '@/db/types';

interface Props {
  initialInputToken: Token | null;
  initialOutputToken: Token | null;
  inputLabel: string;
  outputLabel: string;
  initialInputAmount?: string;
  swapText?: string;
  swappingText?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const Swap: React.FC<Props> = ({
  initialInputToken,
  initialOutputToken,
  inputLabel,
  outputLabel,
  initialInputAmount,
  swapText,
  swappingText,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [inputAmount, setInputAmount] = useState<string>(initialInputAmount || '');
  const [inputToken, setInputToken] = useState<Token | null>(initialInputToken);

  const [outputAmount, setOutputAmount] = useState<string>('');
  const [outputToken, setOutputToken] = useState<Token | null>(initialOutputToken);

  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);

  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const { sendTransaction, wallet } = useSendTransaction();

  const { balance: inputBalance, isLoading: inputBalanceLoading } = useTokenBalance(
    inputToken?.id || '',
    wallet?.address || '',
  );

  const onChangeInputOutput = () => {
    const tempInputToken = inputToken;
    const tempInputAmount = inputAmount;
    setInputToken(outputToken);
    setInputAmount(outputAmount);
    setOutputToken(tempInputToken);
    setOutputAmount(tempInputAmount);
  };

  const onSwap = async () => {
    if (!wallet || !quoteResponse) return;
    setIsSwapping(true);
    try {
      const swapResponse = await getSwapObj(wallet.address, quoteResponse);
      const transactionBase64 = swapResponse.swapTransaction;
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(transactionBase64, 'base64'),
      );
      console.log('Deserialized transaction:', transaction);

      // Don't sign here - let the wallet handle signing when sending
      const txHash = await sendTransaction(transaction);
      onSuccess?.(txHash);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (inputToken && outputToken) {
      const fetchQuoteAndUpdate = async () => {
        setIsQuoteLoading(true);
        setOutputAmount('');
        const quote = await getQuote(
          inputToken.id,
          outputToken.id,
          parseFloat(inputAmount) * 10 ** inputToken.decimals,
        );
        setQuoteResponse(quote);
        setOutputAmount(
          new Decimal(quote.outAmount).div(new Decimal(10).pow(outputToken.decimals)).toString(),
        );
        setIsQuoteLoading(false);
      };

      if (inputAmount && Number(inputAmount) > 0) {
        fetchQuoteAndUpdate();
      } else {
        setQuoteResponse(null);
        setOutputAmount('');
      }
    }
  }, [inputToken, outputToken, inputAmount]);

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <div className="flex flex-col gap-2 items-center w-full">
        <TokenInput
          label={inputLabel}
          amount={inputAmount}
          onChange={setInputAmount}
          token={inputToken}
          onChangeToken={setInputToken}
          address={wallet?.address}
        />
        <Button
          variant="ghost"
          size="icon"
          className="group h-fit w-fit p-1"
          onClick={onChangeInputOutput}
        >
          <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
        </Button>
        <TokenInput
          label={outputLabel}
          amount={outputAmount}
          token={outputToken}
          onChangeToken={setOutputToken}
          address={wallet?.address}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        {wallet ? (
          <Button
            variant="brand"
            className="w-full"
            onClick={onSwap}
            disabled={
              isSwapping ||
              isQuoteLoading ||
              !quoteResponse ||
              !inputToken ||
              !outputToken ||
              !inputAmount ||
              !outputAmount ||
              !inputBalance ||
              inputBalanceLoading ||
              Number(inputAmount) > Number(inputBalance)
            }
          >
            {isQuoteLoading
              ? 'Loading...'
              : Number(inputAmount) > Number(inputBalance)
                ? 'Insufficient balance'
                : isSwapping
                  ? swappingText || 'Swapping...'
                  : swapText || 'Swap'}
          </Button>
        ) : (
          <LogInButton />
        )}
        {onCancel && (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default Swap;
