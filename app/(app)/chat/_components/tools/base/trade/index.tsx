'use client'

import React from 'react';
import ToolCard from '../../tool-card';
import SwapCard from './swap-result';
import SwapCallBody from './call';
import type { ToolInvocation } from 'ai';
import type { TradeResultBodyType, TradeArgumentsType } from '@/ai/base/actions/trade/actions/types';
import type { BaseActionResult } from '@/ai/base-action';

interface TradeProps {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const Trade: React.FC<TradeProps> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText="Completing Trade..."
            result={{
                heading: (result: BaseActionResult<TradeResultBodyType>) => result.body?.success 
                    ? "Trade Complete"
                    : result.body?.error
                        ? "Trade Failed"
                        : "Confirm Trade",
                body: (result: BaseActionResult<TradeResultBodyType>) => result.body?.success 
                    ? <SwapCard />
                    : result.body?.error
                        ? result.body.error
                        : <SwapCallBody toolCallId={tool.toolCallId} args={tool.args as TradeArgumentsType} />
            }}
            defaultOpen={true}
            prevToolAgent={prevToolAgent}
            className="max-w-full"
        />
    );
};

export default Trade; 