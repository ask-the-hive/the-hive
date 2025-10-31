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
          // If status is pending, this is awaiting user confirmation - show the call body
          if (result.body?.status === 'pending') {
            const args = tool.args as SolanaTradeArgumentsType;
            return <SwapCallBody toolCallId={tool.toolCallId} args={args} />;
          }

          // If status is complete, show the result
          if (result.body?.status === 'complete') {
            return <SwapResultCard result={result.body} />;
          }

          return result.message;
        },
      }}
      call={{
        heading: 'Swap',
        body: (toolCallId: string, args: SolanaTradeArgumentsType) => (
          <SwapCallBody toolCallId={toolCallId} args={args} />
        ),
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="max-w-full"
    />
  );
};

export default Swap;
