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
  console.log('Solana Swap Tool', tool);
  return (
    <ToolCard
      tool={tool}
      loadingText="Completing Trade..."
      result={{
        heading: (result: SolanaTradeResultType) =>
          result.body ? 'Ready to Trade' : 'Failed to complete trade',
        body: (result: SolanaTradeResultType) =>
          result.body ? <SwapResultCard result={result.body} /> : result.message,
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
