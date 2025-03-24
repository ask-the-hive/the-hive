'use client'

import React from 'react'

import TokenBalance from '../utils/token-balance'
import ToolCard from '../tool-card'

import type { ToolInvocation } from 'ai'
import type { BscActionResult } from '@/ai/bsc/actions/bsc-action'
import type { BalanceResultBodyType } from '@/ai/bsc/actions/wallet/balance/types'

type BalanceResultType = BscActionResult<BalanceResultBodyType>

interface Props {
    tool: ToolInvocation
    prevToolAgent?: string
}

const GetBalance: React.FC<Props> = ({ tool, prevToolAgent }) => {
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting ${tool.args.tokenSymbol || "BNB"} Balance...`}
            result={{
                heading: (result: BalanceResultType) => result.body?.token 
                    ? `Fetched ${result.body.token} Balance` 
                    : `Failed to fetch balance`,
                body: (result: BalanceResultType) => result.body 
                    ? (
                        <TokenBalance 
                            token={result.body.token}
                            balance={result.body.balance}
                            logoURI={result.body.logoURI}
                            name={result.body.name}
                        />
                    ) : "No balance found"
            }}
            prevToolAgent={prevToolAgent}
        />
    )
}

export default GetBalance 