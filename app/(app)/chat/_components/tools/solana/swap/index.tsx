import React from 'react';

import ToolCard from '../../tool-card';

import SwapResultCard from './swap-result';
import SwapCallBody from './call';

import type { ToolInvocation } from 'ai';
import type { SolanaTradeResultType, SolanaTradeArgumentsType } from '@/ai';

interface SwapProps {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const Swap: React.FC<SwapProps> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Completing Trade..."
      result={{
        heading: (result: SolanaTradeResultType) => {
          // If status is pending, this is awaiting user confirmation - don't show a heading
          if (result.body?.status === 'pending') {
            return 'Swap';
          }
          // If status is complete or failed, show appropriate heading
          return result.body?.status === 'complete' ? 'Swap Complete' : 'Failed to complete trade';
        },
        body: (result: SolanaTradeResultType) => {
          // If status is complete, show the result
          if (result.body?.status === 'complete') {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full md:w-[70%]">
                  <SwapResultCard result={result.body} />
                </div>
              </div>
            );
          }

          const args = tool.args as SolanaTradeArgumentsType;
          return (
            <div className="flex justify-center w-full">
              <div className="w-full md:w-[70%]">
                <SwapCallBody toolCallId={tool.toolCallId} args={args} />
              </div>
            </div>
          );
        },
      }}
      call={{
        heading: 'Swap',
        body: (toolCallId: string, args: SolanaTradeArgumentsType) => (
          <div className="flex justify-center w-full">
            <div className="w-full md:w-[70%]">
              <SwapCallBody toolCallId={toolCallId} args={args} />
            </div>
          </div>
        ),
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default Swap;
