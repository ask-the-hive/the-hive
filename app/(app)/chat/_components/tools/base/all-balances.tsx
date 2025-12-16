'use client'

import React from 'react'
import TokenBalance from '../utils/token-balance'
import ToolCard from '../tool-card'

import type { ToolInvocation } from 'ai'
import type { BaseActionResult } from '@/ai/base/actions/base-action'
import type { AllBalancesResultBodyType } from '@/ai/base/actions/wallet/all-balances/types'

type AllBalancesResultType = BaseActionResult<AllBalancesResultBodyType>

interface Props {
    tool: ToolInvocation
    prevToolAgent?: string
}

const GetAllBalances: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText="Getting all token balances..."
            result={{
                heading: (result: AllBalancesResultType) => 
                    result.body?.balances.length 
                        ? `Found ${result.body.balances.length} tokens` 
                        : `No tokens found`,
                body: (result: AllBalancesResultType) =>
                    result.body?.balances.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {result.body.balances.map((balance, index) => (
                                <TokenBalance
                                    key={index}
                                    token={balance.token}
                                    balance={balance.balance}
                                    logoURI={balance.logoURI}
                                    name={balance.name}
                                />
                            ))}
                        </div>
                    ) : (
                        'No tokens found'
                    )
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default GetAllBalances 
