'use client'

import React from 'react'

interface Props {
    contractAddress: string
}

const BubbleMapsResult: React.FC<Props> = ({ contractAddress }) => {
    return (
        <iframe 
            className="w-[500px] h-[500px] max-w-full rounded-md"
            src={`https://iframe.bubblemaps.io/map?address=${contractAddress}&chain=solana&partnerId=${process.env.NEXT_PUBLIC_BUBBLE_MAPS_PARTNER_ID}`} 
        />
    )
}

export default BubbleMapsResult