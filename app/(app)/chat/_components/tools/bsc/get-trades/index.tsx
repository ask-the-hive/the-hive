import React from 'react';

import ToolCard from '../../tool-card';
import { GetTrades as GetTradesComponent } from './get-trades';

import type { ToolInvocation } from 'ai';
import type { GetTraderTradesResultType } from '../../../../../../../ai/bsc/actions/market/get-trades/types';

interface Props {
    tool: ToolInvocation;
    prevToolAgent?: string;
}

export function GetTrades({ tool, prevToolAgent }: Props) {
    return (
        <ToolCard
            tool={tool}
            loadingText="Getting Trades..."
            result={{
                heading: (result: GetTraderTradesResultType) => result.body 
                    ? "Recent Trades"
                    : "Failed to fetch trades",
                body: (result: GetTraderTradesResultType) => result.body 
                    ? <GetTradesComponent 
                        tokensTraded={result.body.tokensTraded} 
                        tool={tool} 
                        prevToolAgent={prevToolAgent} 
                      />
                    : "No trades found"
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    );
} 