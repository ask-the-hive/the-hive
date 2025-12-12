import React from 'react';

import ToolCard from '../../../tool-card';

import UnstakeCallBody from './call';
import UnstakeResult from './unstake-result';

import type { ToolInvocation } from 'ai';
import type { UnstakeResultType, UnstakeArgumentsType } from '@/ai';


interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const getHeading = (result: UnstakeResultType) => {
  if (!result.body) return 'Failed to unstake';

  switch (result.body.status) {
    case 'guide':
      return 'Unstake guidance';
    case 'pending':
      return 'Unstake pending';
    case 'complete':
      return 'Unstaked';
    case 'cancelled':
      return 'Unstake cancelled';
    default:
      return 'Unstake';
  }
};

const Unstake: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Unstaking..."
      result={{
        heading: (result: UnstakeResultType) => getHeading(result),
        body: (result: UnstakeResultType) =>
          result.body ? <UnstakeResult result={result} /> : result.message,
      }}
      call={{
        heading: 'Unstake',
        body: (toolCallId: string, args: UnstakeArgumentsType) => (
          <UnstakeCallBody toolCallId={toolCallId} args={args} />
        ),
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="max-w-full"
    />
  );
};

export default Unstake;
