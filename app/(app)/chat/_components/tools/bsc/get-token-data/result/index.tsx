'use client'

import React from 'react'

import GetTokenDataResultHeading from './heading';
import Stats from './stats';
import TwentyFourHrStats from './24hr-stats';

import type { GetTokenDataResultBodyType } from '@/ai/bsc/actions/token/get-token-data/types';

interface Props {
    body: GetTokenDataResultBodyType
}

const GetTokenDataResult: React.FC<Props> = ({ body }) => {
    const { token } = body;

    return (
        <div className="flex flex-col gap-2 w-full">
            <GetTokenDataResultHeading token={token} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Stats
                    token={token}
                />
                <TwentyFourHrStats
                    token={token}
                />
            </div>
        </div>
    )
}

export default GetTokenDataResult; 