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
          const status = result.body?.status;
          if (status === 'pending') return 'Stake';
          if (status === 'complete') return 'Stake Complete';
          if (status === 'cancelled') return 'Stake cancelled';
          if (status === 'failed') return 'Stake unavailable';
          if (!result.body) return 'Stake unavailable';
          return 'Stake';
        },
        body: (result: StakeResultType) => {
          // If status is complete, show the result
          if (result.body?.status === 'complete') {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full ">
                  <StakeResult
                    outputTokenData={result.body.outputTokenData}
                    poolData={result.body.poolData}
                    outputAmount={result.body.outputAmount}
                    tx={result.body.tx}
                  />
                </div>
              </div>
            );
          }

          if (
            !result.body ||
            result.body.status === 'failed' ||
            result.body.status === 'cancelled'
          ) {
            return (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {result.message || 'This staking action is not available right now.'}
              </p>
            );
          }

          // status === 'pending'
          const args = tool.args as StakeArgumentsType;
          return <StakeCallBody toolCallId={tool.toolCallId} args={args} />;
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
