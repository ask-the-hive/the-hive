import React from 'react';

import StarterButton from './starter-button';
import { useChat } from '../../_contexts/chat';

const solanaButtons = [
  {
    title: 'Stake SOL',
    description: 'Compare liquid staking yields',
    icon: 'Droplet' as const,
    prompt: 'Find me the best staking yields on Solana',
  },
  {
    title: 'Lend Stablecoins',
    description: 'Find top lending markets',
    icon: 'ChartLine' as const,
    prompt: 'Show me the best lending pools on Solana',
  },
  {
    title: 'Trade',
    description: 'Swap instantly with Jupiter',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
  },
  {
    title: 'Discover',
    description: 'Explore trending Solana assets',
    icon: 'Brain' as const,
    prompt: 'Show me trending Solana tokens',
  },
] as const;

const bscButtons = [
  {
    title: 'Trending',
    description: 'Search the trending tokens',
    icon: 'ChartLine' as const,
    prompt: 'Show me the trending tokens',
  },
  {
    title: 'Liquidity',
    description: 'Get liquidity pools',
    icon: 'Droplet' as const,
    prompt: "Let's get some liquidity pools",
  },
  {
    title: 'Trade',
    description: 'Swap using 0x Protocol',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
  },
  {
    title: 'Knowledge',
    description: 'Get developer docs for protocols',
    icon: 'Brain' as const,
    prompt: 'Get me developer docs for BSC Protocols',
  },
] as const;

const baseButtons = [
  {
    title: 'Trending',
    description: 'Search the trending tokens',
    icon: 'ChartLine' as const,
    prompt: 'Show me the trending tokens',
  },
  {
    title: 'Liquidity',
    description: 'Get liquidity pools',
    icon: 'Droplet' as const,
    prompt: "Let's get some liquidity pools",
  },
  {
    title: 'Trade',
    description: 'Swap using 0x Protocol',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
  },
  {
    title: 'Knowledge',
    description: 'Get developer docs for protocols',
    icon: 'Brain' as const,
    prompt: 'Get me developer docs for Base Protocols',
  },
] as const;

const StarterButtons = () => {
  const { chain } = useChat();
  const buttons = chain === 'solana' ? solanaButtons : chain === 'bsc' ? bscButtons : baseButtons;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full mt-4">
      {buttons.map((button) => (
        <StarterButton key={button.title} {...button} />
      ))}
    </div>
  );
};

export default StarterButtons;
