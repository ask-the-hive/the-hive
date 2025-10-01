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
        heading: (result: StakeResultType) => (result.body ? 'Stake Complete' : 'Failed to Stake'),
        body: (result: StakeResultType) =>
          result.body ? (
            <div className="flex justify-center w-full">
              <div className="w-[70%]">
                <StakeResult
                  outputTokenData={result.body.outputTokenData}
                  poolData={result.body.poolData}
                  outputAmount={result.body.outputAmount}
                />
              </div>
            </div>
          ) : (
            result.message
          ),
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
