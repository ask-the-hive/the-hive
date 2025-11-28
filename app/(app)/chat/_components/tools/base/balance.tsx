'use client';

import React from 'react';

import TokenBalance from '../utils/token-balance';
import ToolCard from '../tool-card';
import { Card, Skeleton } from '@/components/ui';

import type { ToolInvocation } from 'ai';
import type { BaseActionResult } from '@/ai/base/actions/base-action';
import type { BalanceResultBodyType } from '@/ai/base/actions/wallet/balance/types';

type BalanceResultType = BaseActionResult<BalanceResultBodyType>;

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full md:w-[70%]">
        <ToolCard
          tool={tool}
          loadingText={`Getting ${tool.args.tokenSymbol || 'ETH'} Balance...`}
          call={{
            heading: 'Checking balance...',
            body: () => (
              <div className="flex w-full">
                <Skeleton className="h-6 w-16" />
              </div>
            ),
          }}
          result={{
            heading: (result: BalanceResultType) =>
              result.body?.token
                ? `Fetched ${result.body.token} Balance`
                : `Failed to fetch balance`,
            body: (result: BalanceResultType) =>
              result.body ? (
                <TokenBalance
                  token={result.body.token}
                  balance={result.body.balance}
                  logoURI={result.body.logoURI}
                  name={result.body.name}
                />
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">No balance found</p>
              ),
          }}
          prevToolAgent={prevToolAgent}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default GetBalance;
