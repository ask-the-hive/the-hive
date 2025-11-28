import React from 'react';

import ToolCard from '../tool-card';
import { Skeleton } from '@/components/ui';

import type { ToolInvocation } from 'ai';
import type { GetBalanceActionResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
}

const GetBalance: React.FC<Props> = ({ tool }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting ${tool.args.assetId} Balance...`}
      call={{
        heading: 'Checking balance...',
        body: () => (
          <div className="flex w-full">
            <Skeleton className="h-6 w-16" />
          </div>
        ),
      }}
      result={{
        heading: (result: GetBalanceActionResultType) =>
          result.body
            ? `Read ${tool.args.assetId.toUpperCase()} Balance`
            : 'Failed to read balance',
        body: (result: GetBalanceActionResultType) =>
          result.body
            ? `${result.body.balance.toFixed(4)} ${tool.args.assetId.toUpperCase()}`
            : 'No balance found',
      }}
    />
  );
};

export default GetBalance;
