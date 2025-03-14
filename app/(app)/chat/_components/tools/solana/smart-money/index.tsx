import React from 'react'

import ToolCard from '../../tool-card';

import SmartMoneyToken from './smart-money-token';

import type { ToolInvocation } from 'ai';
import type { GetSmartMoneyInflowsResultType } from '@/ai';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const SmartMoneyInflows: React.FC<Props> = ({ tool, prevToolAgent }) => {
    

    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Smart Money Inflows...`}
            result={{
                heading: (result: GetSmartMoneyInflowsResultType) => result.body 
                    ? `Fetched Smart Money Inflows`
                    : `Failed to fetch smart money inflows. Please try again later.`,
                body: (result: GetSmartMoneyInflowsResultType) => result.body 
                    ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.body.tokens.map((token) => (
                                <SmartMoneyToken
                                    key={token.inflow.mint}
                                    {...token}
                                />
                            ))}
                        </div>
                    )
                    :  "No balance found"
            }}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    )
}

export default SmartMoneyInflows;