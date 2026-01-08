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

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

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
  const { mutate, cache } = useSWRConfig();
  const { currentChain, walletAddresses } = useChain();
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
  const fallbackWalletAddress = currentChain === 'solana' ? walletAddresses.solana : '';
  const hasConnectedWalletAddress = Boolean(fallbackWalletAddress);
  const { balance: inputBalance, isLoading: inputBalanceLoading } = useTokenBalance(
    inputToken?.id || '',
    wallet?.address || fallbackWalletAddress || '',
  );

  const hasAutoConnected = useRef(false);

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

  // Intentionally avoid delayed "checking wallet" states to prevent UI flashing when this
  // component mounts/unmounts quickly (e.g., after a card click).

  const refreshBalances = useCallback(
    async (tokenIds: Array<string | null | undefined>) => {
      const windowSolanaAddress =
        typeof window !== 'undefined' && (window as any)?.solana?.publicKey
          ? String((window as any).solana.publicKey)
          : '';

      const addresses = Array.from(
        new Set([wallet?.address, fallbackWalletAddress, windowSolanaAddress].filter(Boolean)),
      );
      if (!addresses.length) return;

      const ids = tokenIds.filter((id): id is string => !!id);
      if (!ids.length) return;

      const keys = addresses.flatMap((address) =>
        ids.flatMap((id) => [
          `token-balance-${id}-${address}`,
          `token-balance-${currentChain}-${id}-${address}`,
        ]),
      );

      await Promise.all(keys.map((key) => mutate(key, undefined, { revalidate: true })));
    },
    [wallet?.address, fallbackWalletAddress, currentChain, mutate],
  );

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const refreshBalancesUntilChanged = useCallback(
    async (tokenIds: Array<string | null | undefined>) => {
      const windowSolanaAddress =
        typeof window !== 'undefined' && (window as any)?.solana?.publicKey
          ? String((window as any).solana.publicKey)
          : '';

      const addresses = Array.from(
        new Set([wallet?.address, fallbackWalletAddress, windowSolanaAddress].filter(Boolean)),
      );
      const ids = tokenIds.filter((id): id is string => !!id);

      if (!addresses.length || !ids.length) return;

      const keys = addresses.flatMap((address) =>
        ids.flatMap((id) => [
          `token-balance-${id}-${address}`,
          `token-balance-${currentChain}-${id}-${address}`,
        ]),
      );

      const startSnapshot = new Map<string, unknown>();
      for (const key of keys) {
        startSnapshot.set(key, cache.get(key));
      }

      const start = Date.now();
      const timeoutMs = 30_000;
      const intervalMs = 500;

      while (Date.now() - start < timeoutMs) {
        await refreshBalances(tokenIds);

        let changed = false;
        for (const key of keys) {
          const before = startSnapshot.get(key);
          const after = cache.get(key);
          if (!Object.is(before, after)) {
            changed = true;
            break;
          }
        }

        if (changed) return;
        await sleep(intervalMs);
      }
    },
    [cache, currentChain, fallbackWalletAddress, refreshBalances, wallet?.address],
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

    // If we're using a browser wallet (e.g. Phantom), connect it before any async network calls.
    // Otherwise the wallet UI may be blocked because the user-gesture context is lost.
    if (
      (wallet?.walletClientType === 'phantom' || wallet?.connectorType === 'solana_adapter') &&
      typeof window !== 'undefined' &&
      (window as any).solana &&
      typeof (window as any).solana.connect === 'function' &&
      (window as any).solana.isConnected !== true
    ) {
      await withTimeout(
        (window as any).solana.connect(),
        15_000,
        'Timed out connecting to your wallet. Please try again.',
      );
    }

    posthog.capture(`${eventName}_initiated`, {
      inputToken: inputToken?.symbol,
      outputToken: outputToken?.symbol,
    });

    setIsSwapping(true);
    try {
      const swapResponse = await withTimeout(
        getSwapObj(wallet.address, quoteResponse),
        20_000,
        'Timed out preparing the swap. Please try again.',
      );
      const transactionBase64 = swapResponse.swapTransaction;
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(transactionBase64, 'base64'),
      );

      const txHash = await withTimeout(
        sendTransaction(transaction),
        60_000,
        "Timed out waiting for wallet approval. Please open your wallet and approve, or try again.",
      );

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      );

      const confirmation = await withTimeout(
        connection.confirmTransaction(txHash, 'confirmed'),
        60_000,
        'Timed out confirming the transaction. Check your wallet activity, then try again.',
      );
      if (confirmation.value.err) {
        onError?.('Transaction failed on-chain. Please try again.');
        return;
      }

      posthog.capture(`${eventName}_confirmed`, {
        amount: Number(inputAmount),
        inputToken: inputToken?.symbol,
        outputToken: outputToken?.symbol,
      });

      try {
        await withTimeout(
          refreshBalancesUntilChanged([inputToken?.id, outputToken?.id]),
          35_000,
          'Timed out refreshing balances.',
        );
      } catch {
        // If balance refresh fails or is slow, still allow the swap flow to complete.
      }
      onSuccess?.(txHash);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      const rejected =
        lower.includes('user rejected') ||
        lower.includes('user denied') ||
        lower.includes('user declined') ||
        lower.includes('declined') ||
        lower.includes('rejected') ||
        lower.includes('denied') ||
        lower.includes('cancel');
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
    if (
      isSwapping ||
      isQuoteLoading ||
      !quoteResponse ||
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      !outputAmount ||
      inputBalanceLoading
    ) {
      return true;
    }

    // `useTokenBalance` returns `null` when balance can't be fetched. Never treat that as 0.
    if (inputBalance === null) return true;

    return Number(inputAmount) > Number(inputBalance);
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
    if (inputBalanceLoading || inputBalance === null) return 'Checking balance...';
    if (Number(inputAmount) > Number(inputBalance)) return 'Insufficient balance';
    if (isSwapping) return swappingText || 'Swapping...';
    return swapText || 'Swap';
  }, [isQuoteLoading, inputAmount, inputBalance, inputBalanceLoading, isSwapping, swappingText, swapText]);

  return (
    <div className={cn('flex flex-col gap-4 max-w-full', className)}>
      <div className="flex flex-col gap-2 items-center w-full">
        <TokenInput
          label={inputLabel}
          amount={inputAmount}
          onChange={handleInputAmountChange}
          token={inputToken}
          onChangeToken={setInputToken}
          address={wallet?.address || fallbackWalletAddress}
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
          address={wallet?.address || fallbackWalletAddress}
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
        ) : hasConnectedWalletAddress ? (
          <Button variant="brand" className="w-full h-12 text-base" disabled>
            Connecting wallet...
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
