import React from 'react';

import ToolCard from '../../tool-card';

import type { ToolInvocation } from 'ai';
import type { TokenHoldersResultType } from '@/ai/base/actions/token/token-holders/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const TokenHolders: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Token Holders...`}
            result={{
                heading: (result: TokenHoldersResultType) => result.body 
                    ? `Fetched Token Holders` 
                    : `Failed to fetch token holders`,
                body: (result: TokenHoldersResultType) => result.body 
                    ? (
                        <p>Total number of holders: {result.body.holderCount}</p>
                    ) : "No token holders found"
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default TokenHolders; 