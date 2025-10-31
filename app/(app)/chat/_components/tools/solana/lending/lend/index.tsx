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
        heading: (result: LendResultType) => (result.body ? 'Lend Complete' : 'Failed to Lend'),
        body: (result: LendResultType) =>
          result.body ? (
            <div className="flex justify-center w-full">
              <div className="w-full md:w-[70%]">
                <LendResult
                  tokenData={result.body.tokenData}
                  poolData={result.body.poolData}
                  amount={result.body.amount}
                />
              </div>
            </div>
          ) : (
            result.message
          ),
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
