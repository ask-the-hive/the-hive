'use client';

import React, { useMemo } from 'react';

import { Card, Skeleton } from '@/components/ui';

import Swap from '@/app/_components/swap';

import { useTokenDataByAddress } from '@/hooks';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import type { SolanaTradeArgumentsType, SolanaTradeResultBodyType } from '@/ai';
import SwapResultCard from './swap-result';
import * as Sentry from '@sentry/nextjs';
import { Token } from '@/db/types';

interface Props {
  toolCallId: string;
  args: SolanaTradeArgumentsType;
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [txSignature, setTxSignature] = React.useState<string | null>(null);
  const [inputAmount, setInputAmount] = React.useState<string>('0');
  const [outputAmount, setOutputAmount] = React.useState<string>('0');
  const [inputToken, setInputToken] = React.useState<Token | null>(null);
  const [outputToken, setOutputToken] = React.useState<Token | null>(null);

  const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(
    args.inputMint || '',
  );
  const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress(
    args.outputMint || '',
  );

  const header = useMemo(() => {
    if (outputTokenLoading || inputTokenLoading) {
      return 'Trade on Solana';
    }

    if (inputTokenData?.symbol && outputTokenData?.symbol) {
      return `Trade ${inputTokenData?.symbol} for ${outputTokenData?.symbol}`;
    }

    return 'Trade on Solana';
  }, [outputTokenData, inputTokenData, outputTokenLoading, inputTokenLoading]);

  const handleSuccess = async (tx: string) => {
    // Set success state immediately for UI feedback
    setIsSuccess(true);
    setTxSignature(tx);
    setErrorMessage(null); // Clear any previous errors

    // Also notify the chat system
    addToolResult<SolanaTradeResultBodyType>(toolCallId, {
      message: `Swap successful!`,
      body: {
        status: 'complete',
        transaction: tx,
        inputAmount: Number(inputAmount) || 0,
        outputAmount: Number(outputAmount) || 0,
        inputToken: inputTokenData?.symbol || '',
        outputToken: outputTokenData?.symbol || '',
        outputTokenAddress: outputTokenData?.id || '',
      },
    });
  };

  const handleError = (error: unknown) => {
    // Check if user cancelled the transaction
    const errorStr = String(error);
    const isUserCancellation =
      errorStr.toLowerCase().includes('user rejected') ||
      errorStr.toLowerCase().includes('user cancelled') ||
      errorStr.toLowerCase().includes('user denied') ||
      errorStr.toLowerCase().includes('rejected by user') ||
      (error as any)?.code === 4001;

    if (isUserCancellation) {
      addToolResult(toolCallId, {
        message: `Swap cancelled`,
        body: {
          status: 'cancelled',
          transaction: '',
          inputAmount: 0,
          inputToken: '',
          outputToken: '',
        },
      });
    } else {
      Sentry.captureException(error);
      // Show error message but keep UI visible for retry
      setErrorMessage('There was an issue submitting the transaction. Please try again.');
    }
  };

  // Show success state if transaction completed
  if (isSuccess && txSignature) {
    return (
      <div className="flex justify-center w-full">
        <div className="w-full md:w-[70%]">
          <SwapResultCard
            result={{
              status: 'complete',
              transaction: txSignature || '',
              inputAmount: Number(inputAmount) || 0,
              outputAmount: Number(outputAmount) || 0,
              inputToken: inputToken?.symbol || inputTokenData?.symbol || '',
              outputToken: outputToken?.symbol || outputTokenData?.symbol || '',
              outputTokenAddress: outputToken?.id || outputTokenData?.id || '',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      {inputTokenLoading || outputTokenLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="w-full">
          <div className="text-center space-y-2 mb-4">
            <h3 className="font-semibold text-lg">{header}</h3>
          </div>
          <Swap
            initialInputToken={inputTokenData}
            initialOutputToken={outputTokenData}
            inputLabel="Sell"
            outputLabel="Buy"
            initialInputAmount={args.inputAmount?.toString()}
            swapText="Swap"
            swappingText="Swapping..."
            onInputChange={(amount) => {
              setInputAmount(amount.toString());
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            onOutputChange={(amount) => {
              setOutputAmount(amount.toString());
            }}
            onOutputTokenChange={(token) => {
              setOutputToken(token);
            }}
            onInputTokenChange={(token) => {
              setInputToken(token);
            }}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={() => {
              addToolResult(toolCallId, {
                message: `Swap cancelled`,
                body: {
                  status: 'cancelled',
                  transaction: '',
                  inputAmount: 0,
                  inputToken: '',
                  outputToken: '',
                },
              });
            }}
          />

          {/* Show error message if transaction failed */}
          <div className="flex justify-center w-full h-4 mt-2">
            {errorMessage && (
              <p className="flex justify-center w-full text-sm text-red-600 dark:text-red-400 text-center">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SwapCallBody;
