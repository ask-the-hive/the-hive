import React from 'react';

import ToolCard from '../../../tool-card';

import StakeCallBody from './call';
import StakeResult from './stake-result';

import type { StakeResultType, StakeArgumentsType } from '@/ai';
import type { ToolInvocation } from 'ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const Stake: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Staking..."
      result={{
        heading: (result: StakeResultType) => {
          // If status is pending, this is awaiting user confirmation - don't show a heading
          if (result.body?.status === 'pending') {
            return 'Stake';
          }
          // If status is complete or failed, show appropriate heading
          return result.body?.status === 'complete' ? 'Stake Complete' : 'Failed to Stake';
        },
        body: (result: StakeResultType) => {
          // If status is pending, this is awaiting user confirmation - show the call body
          if (result.body?.status === 'pending') {
            const args = tool.args as StakeArgumentsType;
            return <StakeCallBody toolCallId={tool.toolCallId} args={args} />;
          }

          // If status is complete, show the result
          if (result.body?.status === 'complete') {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full md:w-[70%]">
                  <StakeResult
                    outputTokenData={result.body.outputTokenData}
                    poolData={result.body.poolData}
                    outputAmount={result.body.outputAmount}
                  />
                </div>
              </div>
            );
          }

          return result.message;
        },
      }}
      call={{
        heading: 'Stake',
        body: (toolCallId: string, args: StakeArgumentsType) => (
          <StakeCallBody toolCallId={toolCallId} args={args} />
        ),
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default Stake;
