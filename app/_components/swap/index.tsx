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

import { cn } from '@/lib/utils';

import { useChain } from '@/app/_contexts/chain-context';
import { useTokenDataByAddress } from '@/hooks';

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
  className?: string;
  priorityTokens?: string[];
  onOutputChange?: (amount: number) => void;
  onInputChange?: (amount: number) => void;
  setSwapResult?: (result: { outputAmount: string; outputToken: string }) => void;
}

const Swap: React.FC<Props> = ({
  initialInputToken,
  initialOutputToken,
  initialInputAmount,
  swapText,
  swappingText,
  onSuccess,
  onError,
  onCancel,
  className,
  inputLabel,
  outputLabel,
  priorityTokens,
  setSwapResult,
}) => {
  const { currentChain } = useChain();
  const [inputAmount, setInputAmount] = useState<string>(initialInputAmount || '');
  const [inputToken, setInputToken] = useState<Token | null>(initialInputToken);
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

  // Check if tokens have complete data needed for calculations
  const hasCompleteTokenData =
    inputToken &&
    outputToken &&
    inputToken.decimals !== undefined &&
    outputToken.decimals !== undefined;

  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteResponse, setQuoteResponse] = useState<any | null>(null);
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
      if (currentChain === 'solana') {
        const swapResponse = await getSwapObj(wallet.address, quoteResponse);
        const transactionBase64 = swapResponse.swapTransaction;
        const transaction = VersionedTransaction.deserialize(
          Buffer.from(transactionBase64, 'base64'),
        );
        console.log('Deserialized transaction:', transaction);

        // Don't sign here - let the wallet handle signing when sending
        const txHash = await sendTransaction(transaction);
        onSuccess?.(txHash);
      } else {
        // For BSC, we'll use the 0x swap quote
        const txHash = await sendTransaction(quoteResponse);
        onSuccess?.(txHash);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
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
          if (currentChain === 'solana') {
            const amount = parseFloat(inputAmount) * 10 ** inputToken.decimals;
            const quote = await getQuote(inputToken.id, outputToken.id, amount);
            setQuoteResponse(quote);

            const outputAmount = new Decimal(quote.outAmount)
              .div(new Decimal(10).pow(outputToken.decimals))
              .toString();

            setOutputAmount(outputAmount);

            // Pass result to parent for success modal
            setSwapResult?.({
              outputAmount,
              outputToken: outputToken.symbol || '',
            });
          } else {
            // For BSC, use 0x API
            const response = await fetch(
              `/api/swap/bsc/quote?sellToken=${inputToken.id}&buyToken=${outputToken.id}&sellAmount=${parseFloat(inputAmount) * 10 ** inputToken.decimals}`,
            );
            const quote = await response.json();
            setQuoteResponse(quote);

            const outputAmount = new Decimal(quote.buyAmount)
              .div(new Decimal(10).pow(outputToken.decimals))
              .toString();
            setOutputAmount(outputAmount);

            // Pass result to parent for success modal
            setSwapResult?.({
              outputAmount,
              outputToken: outputToken.symbol || '',
            });
          }
        } catch (error) {
          console.error('Error fetching quote:', error);
        } finally {
          setIsQuoteLoading(false);
        }
      };

      if (inputAmount && Number(inputAmount) > 0) {
        fetchQuoteAndUpdate();
      } else {
        setQuoteResponse(null);
        setOutputAmount('');
      }
    } else {
      // Clear quote data when tokens are incomplete
      setQuoteResponse(null);
      setOutputAmount('');
    }
  }, [
    hasCompleteTokenData,
    inputAmount,
    currentChain,
    inputToken?.id,
    inputToken?.decimals,
    outputToken?.id,
    outputToken?.decimals,
    setSwapResult,
    outputToken?.symbol,
  ]);

  const defaultPriorityTokens =
    currentChain === 'solana'
      ? [
          'So11111111111111111111111111111111111111112', // SOL
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        ]
      : currentChain === 'base'
        ? [
            '0x4200000000000000000000000000000000000006', // WETH
            '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDC
            '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
          ]
        : [
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
            '0x55d398326f99059fF775485246999027B3197955', // USDT
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
          ];

  return (
    <div className={cn('flex flex-col gap-4 w-full max-w-full', className)}>
      <div className="flex flex-col gap-2 items-center w-full">
        <TokenInput
          label={inputLabel}
          amount={inputAmount}
          onChange={setInputAmount}
          token={inputToken}
          onChangeToken={setInputToken}
          address={wallet?.address}
          priorityTokens={priorityTokens || defaultPriorityTokens}
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
          priorityTokens={priorityTokens || defaultPriorityTokens}
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
