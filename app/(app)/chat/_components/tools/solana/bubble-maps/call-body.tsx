'use client'

import React, { useEffect, useState } from 'react'

import { BubbleMapsArgumentsType } from '@/ai'
import { useChat } from '@/app/(app)/chat/_contexts/chat'
import { Skeleton } from '@/components/ui'

interface Props {
    toolCallId: string,
    args: BubbleMapsArgumentsType
}

const BubbleMapsCallBody: React.FC<Props> = ({ toolCallId, args }) => {
    const { addToolResult } = useChat()
    const [bubbleMapUrl, setBubbleMapUrl] = useState('')

    useEffect(() => {
        const partnerId = process.env.NEXT_PUBLIC_BUBBLE_MAPS_PARTNER_ID;
    if (!partnerId) {
        console.error('NEXT_PUBLIC_BUBBLE_MAPS_PARTNER_ID is not set in environment variables');
        addToolResult(toolCallId, {
            message: 'Bubble Maps integration is not properly configured',
            body: {
                success: false,
                message: 'Bubble Maps integration is not properly configured'
            },
        });
        return;
    }
    
    const url = `https://iframe.bubblemaps.io/map?address=${args.contractAddress}&chain=solana&partnerId=${partnerId}`;
    setBubbleMapUrl(url);
    
    // Notify parent component that the bubble map is ready
    addToolResult(toolCallId, {
        message: "Bubble map is ready",
        body: {
            success: true,
            url: url
        },
    });
    }, [args.contractAddress, toolCallId, addToolResult])

    if (!bubbleMapUrl) {
        return <Skeleton className="h-10 w-full" />
    }

    return (
        <iframe 
            src={bubbleMapUrl}
            className="w-full h-[500px] border rounded-lg"
            title="Bubble Map"
        />
    )
}

export default BubbleMapsCallBody