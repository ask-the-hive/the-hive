'use client'

import React from 'react'
import { Skeleton } from '@/components/ui'

interface Props {
    toolCallId: string,
    args: {
        search: string
    }
}

const BubbleMapsCallBody: React.FC<Props> = ({ args }) => {
    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
                <span className="font-medium">Token:</span>
                <span>{args.search}</span>
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default BubbleMapsCallBody 