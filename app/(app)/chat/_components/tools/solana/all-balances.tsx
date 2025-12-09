import React from 'react'

import ToolCard from '../tool-card';

import type { ToolInvocation } from 'ai';
import type { AllBalancesResultType } from '@/ai';
import { TokenBalance } from '../utils';

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string,
}

const AllBalances: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting All Balances...`}
            result={{
                heading: (result: AllBalancesResultType) => result.body 
                    ? `Fetched All Balances`
                    : `Failed to fetch balances`,
                body: (result: AllBalancesResultType) =>
                    result.body ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {result.body.balances.map((balance) => (
                                <TokenBalance
                                    key={balance.token}
                                    token={balance.token}
                                    balance={balance.balance}
                                    logoURI={balance.logoURI}
                                    name={balance.name}
                                />
                            ))}
                        </div>
                    ) : (
                        "No balance found"
                    )
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default AllBalances;
