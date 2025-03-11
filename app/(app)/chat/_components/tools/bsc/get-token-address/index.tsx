import React from 'react';

import ToolCard from '../../tool-card';
import Address from '@/app/_components/address';

import type { ToolInvocation } from 'ai';
import type { GetTokenAddressResultType } from '@/ai/bsc/actions/token/get-token-address/types';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const GetTokenAddress: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting ${tool.args.keyword} Address...`}
            result={{
                heading: (result: GetTokenAddressResultType) => result.body 
                    ? `Fetched ${tool.args.keyword} Address` 
                    : `Failed to fetch token address`,
                body: (result: GetTokenAddressResultType) => result.body 
                    ? (
                        <Address address={result.body.address} />
                    ) : "No token address found"
            }}
            prevToolAgent={prevToolAgent}
            defaultOpen={false}
        />
    )
}

export default GetTokenAddress; 