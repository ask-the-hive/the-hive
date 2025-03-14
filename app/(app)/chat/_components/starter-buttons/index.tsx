import React from 'react'

import StarterButton from './starter-button';
import { useChat } from '../../_contexts/chat';

const solanaButtons = [
    {
        title: "Trending",
        description: "Search the trending tokens",
        icon: "ChartLine" as const,
        prompt: "Show me the trending tokens"
    }, 
    {
        title: "Stake",
        description: "Stake Sol",
        icon: "Beef" as const,
        prompt: "Find me the best staking yields"
    },
    {
        title: "Trade",
        description: "Swap on Jupiter",
        icon: "ChartCandlestick" as const,
        prompt: "Let's trade some tokens"
    },
    {
        title: "Knowledge",
        description: "Get developer docs for protocols",
        icon: "Brain" as const,
        prompt: "Get me developer docs for Orca"
    }
] as const;

const bscButtons = [
    {
        title: "Trending",
        description: "Search the trending tokens",
        icon: "ChartLine" as const,
        prompt: "Show me the trending tokens"
    },
    {
        title: "Liquidity",
        description: "Get liquidity pools",
        icon: "Droplet" as const,
        prompt: "Let's get some liquidity pools"
    },
    {
        title: "Trade",
        description: "Swap using 0x Protocol",
        icon: "ChartCandlestick" as const,
        prompt: "Let's trade some tokens"
    },
    {
        title: "Knowledge",
        description: "Get developer docs for protocols",
        icon: "Brain" as const,
        prompt: "Get me developer docs for PancakeSwap"
    }
] as const;

const StarterButtons = () => {
    const { chain } = useChat();
    const buttons = chain === 'solana' ? solanaButtons : bscButtons;

    return (
        <div className="grid grid-cols-2 gap-2">
            {buttons.map((button) => (
                <StarterButton 
                    key={button.title} 
                    {...button}
                />
            ))}
        </div>
    )
}

export default StarterButtons