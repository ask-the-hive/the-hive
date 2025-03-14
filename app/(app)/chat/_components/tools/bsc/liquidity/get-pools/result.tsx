'use client'

import React, { useState } from 'react'

import type { GetPoolsResultBodyType } from '@/ai/bsc/actions/liquidity/get-pools/types'
import { BscPool } from '../../../utils/liquidity'
import { Button } from '@/components/ui'

interface Props {
    body: GetPoolsResultBodyType
}

const GetPoolsResult: React.FC<Props> = ({ body }) => {
    const [showAll, setShowAll] = useState(false);
    
    // Ensure pools is an array and filter out any invalid pools
    const validPools = Array.isArray(body.pools) 
        ? body.pools.filter(pool => pool && typeof pool === 'object')
        : [];
    
    if (validPools.length === 0) {
        return <div>No valid pools found</div>;
    }
    
    return (
        <div className="flex flex-col gap-2">
            <div className='flex flex-col gap-2'>
                {
                    validPools.slice(0, showAll ? validPools.length : 1).map((pool, index) => (
                        <BscPool 
                            key={pool.pair_address || `pool-${index}`}
                            pair={pool} 
                        />
                    ))
                }
            </div>
            {
                validPools.length > 1 && (
                    <Button 
                        variant="outline"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? "Show Less" : `Show ${validPools.length - 1} More Pools`}
                    </Button>
                )
            }
        </div>
    )
}

export default GetPoolsResult 