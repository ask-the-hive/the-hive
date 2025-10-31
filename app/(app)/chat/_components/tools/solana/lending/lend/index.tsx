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
          // If tx is empty, this is the initial call state - don't show a heading
          if (result.body?.tx === '') {
            return null;
          }
          // If tx is populated, this is the completion state
          return result.body ? 'Lend Complete' : 'Failed to Lend';
        },
        body: (result: LendResultType) => {
          // If tx is empty, this is the initial call state - show the call body
          if (result.body?.tx === '') {
            const args = tool.args as LendArgumentsType;
            return <LendCallBody toolCallId={tool.toolCallId} args={args} />;
          }

          // If tx is populated, this is the completion state - show the result
          if (result.body && result.body.tx) {
            return (
              <div className="flex justify-center w-full">
                <div className="w-full md:w-[70%]">
                  <LendResult
                    tokenData={result.body.tokenData}
                    poolData={result.body.poolData}
                    amount={result.body.amount}
                  />
                </div>
              </div>
            );
          }

          return result.message;
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
