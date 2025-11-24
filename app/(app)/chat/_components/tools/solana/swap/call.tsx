'use client';

import React from 'react';

import { Card, Skeleton } from '@/components/ui';

import Swap from '@/app/_components/swap';

import { useTokenDataByAddress } from '@/hooks';

import { useChat } from '@/app/(app)/chat/_contexts/chat';

import type { SolanaTradeArgumentsType, SolanaTradeResultBodyType } from '@/ai';

interface Props {
  toolCallId: string;
  args: SolanaTradeArgumentsType;
}

const SwapCallBody: React.FC<Props> = ({ toolCallId, args }) => {
  const { addToolResult } = useChat();

  const { data: inputTokenData, isLoading: inputTokenLoading } = useTokenDataByAddress(
    args.inputMint || '',
  );
  const { data: outputTokenData, isLoading: outputTokenLoading } = useTokenDataByAddress(
    args.outputMint || '',
  );

  return (
    <Card className="p-6">
      {inputTokenLoading || outputTokenLoading ? (
        <Skeleton className="h-48 w-96" />
      ) : (
        <Swap
          initialInputToken={inputTokenData}
          initialOutputToken={outputTokenData}
          inputLabel="Sell"
          outputLabel="Buy"
          initialInputAmount={args.inputAmount?.toString()}
          swapText="Swap"
          swappingText="Swapping..."
          onSuccess={(tx) => {
            addToolResult<SolanaTradeResultBodyType>(toolCallId, {
              message: `Swap successful!`,
              body: {
                status: 'complete',
                transaction: tx,
                inputAmount: args.inputAmount || 0,
                inputToken: inputTokenData?.symbol || '',
                outputToken: outputTokenData?.symbol || '',
              },
            });
          }}
          onError={(error) => {
            addToolResult(toolCallId, {
              message: `Swap failed: ${error}`,
            });
          }}
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
      )}
    </Card>
  );
};

export default SwapCallBody;
