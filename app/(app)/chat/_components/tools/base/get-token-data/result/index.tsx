'use client'

import React from 'react'
import { Card } from '@/components/ui/card'

import GetTokenDataResultHeading from './heading';
import Stats from './stats';
import TwentyFourHrStats from './24hr-stats';
import Links from './links';

interface Props {
    body: {
        token: any; // Using any for now since we'll reuse the BSC types
    }
}

const GetTokenDataResult: React.FC<Props> = ({ body }) => {
    const { token } = body;

    return (
        <div className="flex flex-col gap-2 w-full">
            <Card className="p-2 flex flex-col md:flex-row justify-between gap-4">
                <GetTokenDataResultHeading token={token} />
                <Links token={token} />
            </Card>
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