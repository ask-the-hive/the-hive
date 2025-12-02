'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';

import { ChevronDown } from 'lucide-react';

import { VersionedTransaction, Connection } from '@solana/web3.js';

import Decimal from 'decimal.js';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

import LogInButton from '@/app/(app)/_components/log-in-button';

import TokenInput from './token-input';

import { useSendTransaction, useTokenBalance, useTokenDataByAddress } from '@/hooks';

import { getSwapObj, getQuote } from '@/services/jupiter';

// QuoteResponse type for Jupiter lite API
type QuoteResponse = any;
import type { Token } from '@/db/types';
import * as Sentry from '@sentry/nextjs';
interface Props {
  initialInputToken: Token | null;
  initialOutputToken: Token | null;
  inputLabel: string;
  outputLabel: string;
  initialInputAmount?: string;
  swapText?: string;
  swappingText?: string;
  receiveTooltip?: string | React.ReactNode;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onInputChange?: (amount: number) => void;
  onOutputChange?: (amount: number) => void;
  onOutputTokenChange?: (token: Token) => void;
  onInputTokenChange?: (token: Token) => void;
  className?: string;
  setSwapResult?: (result: { outputAmount: string; outputToken: string; inputToken: string }) => void;
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
  onInputChange,
  onOutputChange,
  onOutputTokenChange,
  onInputTokenChange,
  receiveTooltip,
  className,
  setSwapResult,
}) => {
  const [inputAmount, setInputAmount] = useState<string>(initialInputAmount || '');
  const [inputToken, setInputToken] = useState<Token | null>(initialInputToken);

  const handleInputAmountChange = (amount: string) => {
    setInputAmount(amount);
    const numericAmount = parseFloat(amount) || 0;
    onInputChange?.(numericAmount);
  };

  const onOutputChangeRef = useRef(onOutputChange);
  onOutputChangeRef.current = onOutputChange;

  const handleOutputAmountChange = useCallback((amount: string) => {
    setOutputAmount(amount);
    const numericAmount = parseFloat(amount) || 0;
    onOutputChangeRef.current?.(numericAmount);
  }, []);

  const [outputAmount, setOutputAmount] = useState<string>('');
  const [outputToken, setOutputToken] = useState<Token | null>(initialOutputToken);

  // Fetch complete token data if decimals is missing
  const { data: completeOutputTokenData } = useTokenDataByAddress(
    outputToken?.id && outputToken.decimals === undefined ? outputToken.id : '',
  );

  // Effect to update outputToken with complete data when decimals is missing
  useEffect(() => {
    if (outputToken && outputToken.decimals === undefined && completeOutputTokenData) {
      setOutputToken(completeOutputTokenData);
    }
  }, [outputToken, completeOutputTokenData]);

  useEffect(() => {
    if (outputToken) {
      onOutputTokenChange?.(outputToken);
    }
  }, [outputToken, onOutputTokenChange]);

  useEffect(() => {
    if (inputToken) {
      onInputTokenChange?.(inputToken);
    }
  }, [inputToken, onInputTokenChange]);

  // Check if tokens have complete data needed for calculations
  const hasCompleteTokenData =
    inputToken &&
    outputToken &&
    inputToken.decimals !== undefined &&
    outputToken.decimals !== undefined;

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
    handleInputAmountChange(outputAmount);
    setOutputToken(tempInputToken);
    handleOutputAmountChange(tempInputAmount);
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

      // Don't sign here - let the wallet handle signing when sending
      const txHash = await sendTransaction(transaction);

      // Wait for confirmation and check if it succeeded
      // Note: We need to verify the transaction actually succeeded on-chain
      // Privy's sendTransaction returns a signature even if the transaction fails
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      );

      const confirmation = await connection.confirmTransaction(txHash, 'confirmed');
      if (confirmation.value.err) {
        onError?.('Transaction failed on-chain. Please try again.');
        return;
      }

      onSuccess?.(txHash);
    } catch (error) {
      Sentry.captureException(error);
      onError?.('There was an issue submitting the transaction. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (hasCompleteTokenData) {
      const fetchQuoteAndUpdate = async () => {
        setIsQuoteLoading(true);
        setOutputAmount('');
        try {
          const inputAmountWei = new Decimal(inputAmount || '0')
            .mul(new Decimal(10).pow(inputToken.decimals))
            .toFixed(0, Decimal.ROUND_DOWN);

          // Check if the output token address looks valid (should be 32-44 characters)
          if (!outputToken.id || outputToken.id.length < 32) {
            throw new Error(`Invalid output token address: ${outputToken.id}`);
          }

          const quote = await getQuote(inputToken.id, outputToken.id, inputAmountWei);
          setQuoteResponse(quote);

          const outputAmountStr = new Decimal(quote.outAmount)
            .div(new Decimal(10).pow(outputToken.decimals))
            .toString();

          handleOutputAmountChange(outputAmountStr);

          // Call setSwapResult if provided
          if (setSwapResult && inputToken) {
            setSwapResult({
              outputAmount: outputAmountStr,
              outputToken: outputToken.symbol,
              inputToken: inputToken.symbol,
            });
          }
        } catch (error) {
          onError?.('There was an issue fetching the quote. Please try again.');
          Sentry.captureException(error);
        } finally {
          setIsQuoteLoading(false);
        }
      };

      if (inputAmount && Number(inputAmount) > 0) {
        fetchQuoteAndUpdate();
      } else {
        setQuoteResponse(null);
        handleOutputAmountChange('');
      }
    }
  }, [
    hasCompleteTokenData,
    inputToken,
    onError,
    outputToken,
    inputAmount,
    handleOutputAmountChange,
    setSwapResult,
  ]);

  const isSwapDisabled = useMemo(() => {
    return (
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
    );
  }, [
    isSwapping,
    isQuoteLoading,
    quoteResponse,
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    inputBalance,
    inputBalanceLoading,
  ]);

  const buttonText = useMemo(() => {
    if (isQuoteLoading) return 'Loading...';
    if (Number(inputAmount) > Number(inputBalance)) return 'Insufficient balance';
    if (isSwapping) return swappingText || 'Swapping...';
    return swapText || 'Swap';
  }, [isQuoteLoading, inputAmount, inputBalance, isSwapping, swappingText, swapText]);

  return (
    <div className={cn('flex flex-col gap-4 max-w-full', className)}>
      <div className="flex flex-col gap-2 items-center w-full">
        <TokenInput
          label={inputLabel}
          amount={inputAmount}
          onChange={handleInputAmountChange}
          token={inputToken}
          onChangeToken={setInputToken}
          address={wallet?.address}
        />
        <div className="relative flex items-center justify-center -my-5 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white dark:bg-neutral-500 border-2 border-neutral-50 dark:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-brand-600 dark:hover:border-neutral-50 shadow-sm"
            onClick={onChangeInputOutput}
          >
            <ChevronDown className="h-5 w-5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-50" />
          </Button>
        </div>
        <TokenInput
          label={outputLabel}
          amount={outputAmount}
          token={outputToken}
          onChangeToken={setOutputToken}
          address={wallet?.address}
          tooltip={receiveTooltip}
        />
      </div>
      <div className="flex flex-col gap-2 items-center pt-2">
        {wallet ? (
          <Button
            variant="brand"
            className="w-full h-12 text-base"
            onClick={onSwap}
            disabled={isSwapDisabled}
          >
            {buttonText}
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
