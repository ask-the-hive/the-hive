import React from 'react';

import ToolCard from '../../../tool-card';

import LendCallBody from './call';
import LendResult from './lend-result';

import type { LendResultType, LendArgumentsType } from '@/ai';
import type { ToolInvocation } from 'ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const Lend: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Lending..."
      result={{
        heading: (result: LendResultType) => {
          // If status is pending, this is awaiting user confirmation - don't show a heading
          if (result.body?.status === 'pending') {
            return 'Lend';
          }
          // If status is complete or failed, show appropriate heading
          return result.body?.status === 'complete' ? 'Lend Complete' : 'Failed to Lend';
        },
        body: (result: LendResultType) => {
          // If status is complete, show the result
          if (result.body?.status === 'complete') {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full ">
                  <LendResult
                    tokenData={result.body.tokenData}
                    poolData={result.body.poolData}
                    amount={result.body.amount}
                    tx={result.body.tx}
                  />
                </div>
              </div>
            );
          }

          const args = tool.args as LendArgumentsType;
          return <LendCallBody toolCallId={tool.toolCallId} args={args} />;
        },
      }}
      call={{
        heading: 'Lend',
        body: (toolCallId: string, args: LendArgumentsType) => (
          <LendCallBody toolCallId={toolCallId} args={args} />
        ),
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

export default Lend;
