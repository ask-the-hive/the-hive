import React from 'react';

import ToolCard from '../tool-card';
import { TokenBalance } from '../utils';
import SwapCallBody from './swap/call';

import type { ToolInvocation } from 'ai';
import type { BalanceResultType, SolanaTradeArgumentsType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting ${tool.args.tokenAddress || 'SOL'} Balance...`}
      result={{
        heading: (result: BalanceResultType) =>
          result.body?.token ? `Fetched ${result.body.token} Balance` : `Failed to fetch balance`,
        body: (result: BalanceResultType) =>
          result.body ? (
            <div className="flex flex-col gap-4">
              <TokenBalance
                token={result.body.token}
                balance={result.body.balance}
                logoURI={result.body.logoURI}
                name={result.body.name}
              />
              {/* Show trade UI if SOL balance is 0 */}
              {result.body.token === 'SOL' && result.body.balance === 0 && (
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
              )}
            </div>
          ) : (
            'No balance found'
          ),
      }}
      prevToolAgent={prevToolAgent}
    />
  );
};

export default GetBalance;
