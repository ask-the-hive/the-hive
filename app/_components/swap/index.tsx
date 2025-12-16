'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import LogInButton from '@/app/(app)/_components/log-in-button';
import TokenInput from './token-input';
import { useChain } from '@/app/_contexts/chain-context';
import { useSendTransaction, useTokenBalance, useTokenDataByAddress, useLogin } from '@/hooks';
import { getSwapObj, getQuote } from '@/services/jupiter';
import { useSWRConfig } from 'swr';

type QuoteResponse = any;
import type { Token } from '@/db/types';
import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
interface Props {
  initialInputToken: Token | null;
  initialOutputToken: Token | null;
  inputLabel: string;
  outputLabel: string;
  initialInputAmount?: string;
  swapText?: string;
  swappingText?: string;
  eventName: 'swap' | 'unstake' | 'stake';
  receiveTooltip?: string | React.ReactNode;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onInputChange?: (amount: number) => void;
  onOutputChange?: (amount: number) => void;
  onOutputTokenChange?: (token: Token) => void;
  onInputTokenChange?: (token: Token) => void;
  className?: string;
  setSwapResult?: (result: {
    outputAmount: string;
    outputToken: string;
    inputToken: string;
  }) => void;
  autoConnectOnMount?: boolean;
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
  eventName,
  autoConnectOnMount = false,
}) => {
  const { mutate } = useSWRConfig();
  const { currentChain } = useChain();
  const { login, connectWallet, user, ready } = useLogin();
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
  const { data: completeOutputTokenData } = useTokenDataByAddress(
    outputToken?.id && outputToken.decimals === undefined ? outputToken.id : '',
  );

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

  const hasCompleteTokenData =
    inputToken &&
    outputToken &&
    inputToken.decimals !== undefined &&
    outputToken.decimals !== undefined;

  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const setSwapResultRef = useRef(setSwapResult);
  setSwapResultRef.current = setSwapResult;
  const lastQuoteParamsRef = useRef<string | null>(null);

  const { sendTransaction, wallet } = useSendTransaction();
  const { balance: inputBalance, isLoading: inputBalanceLoading } = useTokenBalance(
    inputToken?.id || '',
    wallet?.address || '',
  );

  const hasAutoConnected = useRef(false);

  // Auto prompt connect/login when requested (e.g., staking flow) so users aren't stuck on the button
  useEffect(() => {
    if (!autoConnectOnMount) return;
    if (hasAutoConnected.current) return;
    if (!ready) return;
    if (wallet) return;

    hasAutoConnected.current = true;
    if (user) {
      connectWallet();
    } else {
      login?.();
    }
  }, [autoConnectOnMount, wallet, user, connectWallet, login, ready]);

  const refreshBalances = useCallback(
    async (tokenIds: Array<string | null | undefined>) => {
      if (!wallet?.address) return;

      const keys = tokenIds
        .filter((id): id is string => !!id)
        .flatMap((id) => [
          `token-balance-${id}-${wallet.address}`,
          `token-balance-${currentChain}-${id}-${wallet.address}`,
        ]);

      if (!keys.length) return;

      await Promise.all(keys.map((key) => mutate(key, undefined, { revalidate: true })));
    },
    [wallet?.address, currentChain, mutate],
  );

  const onChangeInputOutput = () => {
    const tempInputToken = inputToken;
    const tempInputAmount = inputAmount;
    setInputToken(outputToken);
    handleInputAmountChange(outputAmount);
    setOutputToken(tempInputToken);
    handleOutputAmountChange(tempInputAmount);
    lastQuoteParamsRef.current = null;
  };

  /**
   * Executes the Jupiter swap using the current quote and handles wallet cancellation gracefully.
   */
  const onSwap = async () => {
    if (!wallet || !quoteResponse) return;

    posthog.capture(`${eventName}_initiated`, {
      inputToken: inputToken?.symbol,
      outputToken: outputToken?.symbol,
    });

    setIsSwapping(true);
    try {
      const swapResponse = await getSwapObj(wallet.address, quoteResponse);
      const transactionBase64 = swapResponse.swapTransaction;
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(transactionBase64, 'base64'),
      );

      const txHash = await sendTransaction(transaction);

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      );

      const confirmation = await connection.confirmTransaction(txHash, 'confirmed');
      if (confirmation.value.err) {
        onError?.('Transaction failed on-chain. Please try again.');
        return;
      }

      posthog.capture(`${eventName}_confirmed`, {
        amount: Number(inputAmount),
        inputToken: inputToken?.symbol,
        outputToken: outputToken?.symbol,
      });

      void refreshBalances([inputToken?.id, outputToken?.id]);

      onSuccess?.(txHash);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const rejected = /reject|denied|declined|cancel/i.test(message);
      if (rejected) {
        onCancel?.();
        return;
      }
      Sentry.captureException(error);
      onError?.('There was an issue submitting the transaction. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const inputTokenId = inputToken?.id;
  const inputTokenDecimals = inputToken?.decimals;
  const inputTokenSymbol = inputToken?.symbol;
  const outputTokenId = outputToken?.id;
  const outputTokenDecimals = outputToken?.decimals;
  const outputTokenSymbol = outputToken?.symbol;

  useEffect(() => {
    if (
      !hasCompleteTokenData ||
      !inputAmount ||
      Number(inputAmount) <= 0 ||
      inputTokenId === undefined ||
      inputTokenDecimals === undefined ||
      outputTokenId === undefined ||
      outputTokenDecimals === undefined
    ) {
      setQuoteResponse(null);
      handleOutputAmountChange('');
      lastQuoteParamsRef.current = null;
      return;
    }

    const quoteParamsKey = `${inputTokenId}-${outputTokenId}-${inputAmount}`;

    if (lastQuoteParamsRef.current === quoteParamsKey) {
      return;
    }

    const fetchQuote = async () => {
      setIsQuoteLoading(true);
      setOutputAmount('');

      try {
        const inputAmountWei = new Decimal(inputAmount || '0')
          .mul(new Decimal(10).pow(inputTokenDecimals))
          .toFixed(0, Decimal.ROUND_DOWN);

        if (!outputTokenId || outputTokenId.length < 32) {
          throw new Error(`Invalid output token address: ${outputTokenId}`);
        }

        const quote = await getQuote(inputTokenId, outputTokenId, inputAmountWei);

        lastQuoteParamsRef.current = quoteParamsKey;

        setQuoteResponse(quote);

        const outputAmountStr = new Decimal(quote.outAmount)
          .div(new Decimal(10).pow(outputTokenDecimals))
          .toString();

        handleOutputAmountChange(outputAmountStr);

        if (setSwapResultRef.current && inputTokenSymbol && outputTokenSymbol) {
          setSwapResultRef.current({
            outputAmount: outputAmountStr,
            outputToken: outputTokenSymbol,
            inputToken: inputTokenSymbol,
          });
        }
      } catch (error) {
        onErrorRef.current?.('There was an issue fetching the quote. Please try again.');
        Sentry.captureException(error);
      } finally {
        setIsQuoteLoading(false);
      }
    };

    fetchQuote();
  }, [
    hasCompleteTokenData,
    inputTokenId,
    inputTokenDecimals,
    inputTokenSymbol,
    outputTokenId,
    outputTokenDecimals,
    outputTokenSymbol,
    inputAmount,
    handleOutputAmountChange,
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
