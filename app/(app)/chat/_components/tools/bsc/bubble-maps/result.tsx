'use client'

import React from 'react'

interface Props {
    url: string
}

const BubbleMapsResult: React.FC<Props> = ({ url }) => {
    return (
        <iframe 
            className="w-[500px] h-[500px] max-w-full rounded-md"
            src={url} 
        />
    )
}

export default BubbleMapsResult 