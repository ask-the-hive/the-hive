import React from 'react';
import Image from 'next/image';

import { Card, Skeleton } from '@/components/ui';

import TokenChart from '@/app/(app)/_components/token/chart';

import ToolCard from '../tool-card';

import { useTokenMetadata } from '@/hooks';

import type { ToolInvocation } from 'ai';
import type { TokenPriceChartResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const PriceChart: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText={`Getting Token Price Chart...`}
      result={{
        heading: (result: TokenPriceChartResultType) =>
          result.body ? `Fetched Token Price Chart` : `Failed to fetch token price chart`,
        body: (result: TokenPriceChartResultType) =>
          result.body ? (
            <PriceChartBody tokenAddress={tool.args.tokenAddress} />
          ) : (
            'No token price chart found'
          ),
      }}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const PriceChartBody = ({ tokenAddress }: { tokenAddress: string }) => {
  const { data: tokenMetadata, isLoading } = useTokenMetadata(tokenAddress);

  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      {isLoading ? (
        <Skeleton className="w-full h-8" />
      ) : (
        tokenMetadata && (
          <div className="w-full flex items-center gap-2">
            <Image
              src={tokenMetadata.logo_uri}
              alt={tokenMetadata.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <h3 className="text-lg font-bold">
              {tokenMetadata.name} (${tokenMetadata.symbol})
            </h3>
          </div>
        )
      )}
      <Card className="overflow-hidden">
        <TokenChart mint={tokenAddress} />
      </Card>
    </div>
  );
};

export default PriceChart;
