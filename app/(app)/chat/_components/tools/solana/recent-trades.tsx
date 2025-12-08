import React, { useState } from 'react';
import Image from 'next/image';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import ToolCard from '../tool-card';
import type { ToolInvocation } from 'ai';
import type { GetTraderTradesResultBodyType, GetTraderTradesResultType } from '@/ai';

interface Props {
  tool: ToolInvocation;
  prevToolAgent?: string;
}

const GetTrades: React.FC<Props> = ({ tool, prevToolAgent }) => {
  return (
    <ToolCard
      tool={tool}
      loadingText="Getting Trades..."
      result={{
        heading: (result: GetTraderTradesResultType) =>
          result.body ? `Recent Trades` : `Failed to fetch trades`,
        body: (result: GetTraderTradesResultType) =>
          result.body ? <TradesTable body={result.body} /> : 'No trades found',
      }}
      defaultOpen={true}
      prevToolAgent={prevToolAgent}
      className="w-full"
    />
  );
};

const TradesTable = ({ body }: { body: GetTraderTradesResultBodyType }) => {
  const [showAll, setShowAll] = useState(false);
  const tokens = Object.entries(body.tokensTraded).sort((a, b) => b[1].usdChange - a[1].usdChange);

  return (
    <Card className="flex flex-col gap-2 w-full p-2">
      <div className={`overflow-y-auto ${showAll ? 'max-h-96' : ''}`}>
        <Table className="text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Asset</TableHead>
              <TableHead className="text-center">Volume</TableHead>
              <TableHead className="text-center">Balance Change</TableHead>
              <TableHead className="text-center">Value Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.slice(0, showAll ? tokens.length : 5).map(([address, trade]) => (
              <TableRow key={address}>
                <TableCell className="">
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Image
                      src={trade.token.logoURI}
                      alt={trade.token.symbol}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                    <span className="font-medium">{trade.token.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col w-full gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-red-500">
                        {(
                          (trade.volume.sell / (trade.volume.buy + trade.volume.sell)) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                      <span className="text-green-500">
                        {(
                          (trade.volume.buy / (trade.volume.buy + trade.volume.sell)) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="flex w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${(trade.volume.sell / (trade.volume.buy + trade.volume.sell)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(trade.volume.buy / (trade.volume.buy + trade.volume.sell)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-500">
                        {new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(trade.volume.sell)}
                      </span>
                      <span className="text-green-500">
                        {new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(trade.volume.buy)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={trade.balanceChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {trade.balanceChange > 0 ? '+' : ''}
                  {trade.balanceChange.toLocaleString()}
                </TableCell>
                <TableCell className={trade.usdChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {trade.usdChange > 0 ? '+' : '-'}$
                  {Math.abs(trade.usdChange).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {tokens.length > 5 && (
        <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Less' : 'Show All'}
        </Button>
      )}
    </Card>
  );
};

export default GetTrades;
