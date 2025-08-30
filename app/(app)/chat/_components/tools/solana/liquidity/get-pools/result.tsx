'use client'

import React from 'react'

import type { GetPoolsResultBodyType } from '@/ai'
import { RaydiumPool } from '../../../utils'

interface Props {
    body: GetPoolsResultBodyType
}

const GetPoolsResult: React.FC<Props> = ({ body }) => {
    
    return (
        <div className="flex flex-col gap-2">
            <div className='flex flex-col gap-2 max-h-96 overflow-y-auto pr-2'>
                {
                    body.pools.map((pool) => (
                        <RaydiumPool 
                            key={pool.pool.id}
                            pool={pool.pool} 
                            pair={pool.pair} 
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default GetPoolsResult;