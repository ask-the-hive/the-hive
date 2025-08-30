'use client'

import React from 'react'

import type { GetPoolsResultBodyType } from '@/ai/bsc/actions/liquidity/get-pools/types'
import { BscPool } from '../../../utils/liquidity'

interface Props {
    body: GetPoolsResultBodyType
}

const GetPoolsResult: React.FC<Props> = ({ body }) => {
    // Ensure pools is an array and filter out any invalid pools
    const validPools = Array.isArray(body.pools) 
        ? body.pools.filter(pool => pool && typeof pool === 'object')
        : [];
    
    if (validPools.length === 0) {
        return <div>No valid pools found</div>;
    }
    
    return (
        <div className="flex flex-col gap-2">
            <div className='flex flex-col gap-2 max-h-96 overflow-y-auto pr-2'>
                {
                    validPools.map((pool, index) => (
                        <BscPool 
                            key={pool.pair_address || `pool-${index}`}
                            pair={pool} 
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default GetPoolsResult 