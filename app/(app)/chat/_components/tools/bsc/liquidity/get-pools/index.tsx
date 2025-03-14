'use client'

import React from 'react'

import ToolCard from '../../../tool-card'

import GetPoolsResult from './result'

import type { GetPoolsResultType } from '@/ai/bsc/actions/liquidity/get-pools/types'
import type { ToolInvocation } from 'ai'

interface Props {
    tool: ToolInvocation,
    prevToolAgent?: string
}

const GetPools: React.FC<Props> = ({ tool, prevToolAgent }) => {
    
    return (
        <ToolCard 
            tool={tool}
            loadingText={`Getting Liquidity Pools...`}
            result={{
                heading: (result: GetPoolsResultType) => result.body?.pools 
                    ? `Fetched ${result.body.pools.length} Pools` 
                    : `Failed to fetch pools`,
                body: (result: GetPoolsResultType) => result.body 
                    ? (
                        <GetPoolsResult body={result.body} />
                    ) : "No pools found"
            }}
            prevToolAgent={prevToolAgent}
            className="w-full"
        />
    )
}

export default GetPools; 