import React from 'react';

import ToolCard from '../tool-card';
import { TokenBalance } from '../utils';
import SwapCallBody from './swap/call';
import { useChat } from '@/app/(app)/chat/_contexts/chat';

import type { ToolInvocation } from 'ai';
import type { BalanceResultType, SolanaTradeArgumentsType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
  const { messages } = useChat();
  // Check if we're in a staking flow by looking for recent staking-related tool invocations
  const isInStakingFlow = messages.some((message) =>
    message.parts?.some((part) => {
      return part.type === 'tool-invocation' && part.toolInvocation.toolName.includes(`staking-`);
    }),
  );

  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting ${tool.args.tokenAddress || 'SOL'} balance...`}
      result={{
        heading: (result: BalanceResultType) =>
          result.body?.token
            ? isInStakingFlow && result.body.token === 'SOL'
              ? null
              : `Fetched ${result.body.token} balance`
            : `Failed to fetch balance`,
        body: (result: BalanceResultType) => {
          const isStakingSOL = isInStakingFlow && result.body?.token === 'SOL';
          if (result.body) {
            if (isStakingSOL && result.body.balance > 0) {
              return null;
            }

            return (
              <div className="flex justify-center w-full">
                <div className="w-full md:w-[70%]">
                  <div className="flex flex-col gap-4">
                    {/* Show trade UI if SOL balance is 0 */}
                    {isStakingSOL && result.body.balance === 0 ? (
                      <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          You need SOL to stake. Trade other tokens for SOL below:
                        </p>
                        <SwapCallBody
                          toolCallId={`trade-${Date.now()}`}
                          args={
                            {
                              inputMint: undefined, // Let user choose input token
                              outputMint: 'So11111111111111111111111111111111111111112', // SOL mint
                              inputAmount: undefined,
                            } as SolanaTradeArgumentsType
                          }
                        />
                      </div>
                    ) : (
                      <TokenBalance
                        token={result.body.token}
                        balance={result.body.balance}
                        logoURI={result.body.logoURI}
                        name={result.body.name}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return <p className="text-sm text-neutral-600 dark:text-neutral-400">No balance found</p>;
        },
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default GetBalance;
