import React from 'react'

import StarterButton from './starter-button';

const starterButtons = [
    {
        title: "Holder Analysis",
        icon: "Coins" as const,
        prompt: "Analyze the holders of this token"
    }, 
    {
        title: "Liquidity Pools",
        icon: "Droplet" as const,
        prompt: "Analyze the liquidity pools of this token"
    },
    {
        title: "Twitter Sentiment",
        icon: "Twitter" as const,
        prompt: "Analyze the sentiment of the Twitter community for this token"
    },
    {
        title: "Trading Activity",
        icon: "ChartCandlestick" as const,
        prompt: "Analyze the trading activity of this token"
    }
] as const

const StarterButtons = () => {
    return (
        <div className="grid grid-cols-2 gap-2">
            {starterButtons.map((button) => (
                <StarterButton 
                    key={button.title} 
                    {...button}
                />
            ))}
        </div>
    )
}

export default StarterButtons