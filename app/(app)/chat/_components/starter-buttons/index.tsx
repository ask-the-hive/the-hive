import React from 'react';

import StarterButton from './starter-button';
import { useChat } from '../../_contexts/chat';

const solanaButtons = [
  {
    title: 'Stake SOL',
    description: 'Compare liquid staking yields',
    icon: 'Droplet' as const,
    prompt: 'Find me the best staking yields on Solana',
    eventName: 'stake_strategy_clicked',
  },
  {
    title: 'Lend Stablecoins',
    description: 'Find top lending markets',
    icon: 'ChartLine' as const,
    prompt: 'Show me the best lending pools on Solana',
    eventName: 'lend_strategy_clicked',
  },
  {
    title: 'Trade',
    description: 'Swap instantly with Jupiter',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
    eventName: 'trade_strategy_clicked',
  },
] as const;

const bscButtons = [
  {
    title: 'Trending',
    description: 'Search the trending tokens',
    icon: 'ChartLine' as const,
    prompt: 'Show me the trending tokens',
    eventName: 'trending_clicked',
  },
  {
    title: 'Liquidity',
    description: 'Get liquidity pools',
    icon: 'Droplet' as const,
    prompt: "Let's get some liquidity pools",
    eventName: 'liquidity_clicked',
  },
  {
    title: 'Trade',
    description: 'Swap using 0x Protocol',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
    eventName: 'trade_strategy_clicked',
  },
  {
    title: 'Knowledge',
    description: 'Get developer docs for protocols',
    icon: 'Brain' as const,
    prompt: 'Get me developer docs for BSC Protocols',
    eventName: 'knowledge_clicked',
  },
] as const;

const baseButtons = [
  {
    title: 'Trending',
    description: 'Search the trending tokens',
    icon: 'ChartLine' as const,
    prompt: 'Show me the trending tokens',
    eventName: 'trending_clicked',
  },
  {
    title: 'Liquidity',
    description: 'Get liquidity pools',
    icon: 'Droplet' as const,
    prompt: "Let's get some liquidity pools",
    eventName: 'liquidity_clicked',
  },
  {
    title: 'Trade',
    description: 'Swap using 0x Protocol',
    icon: 'ChartCandlestick' as const,
    prompt: "Let's trade some tokens",
    eventName: 'trade_strategy_clicked',
  },
  {
    title: 'Knowledge',
    description: 'Get developer docs for protocols',
    icon: 'Brain' as const,
    prompt: 'Get me developer docs for Base Protocols',
    eventName: 'knowledge_clicked',
  },
] as const;

const StarterButtons = () => {
  const { chain } = useChat();
  const buttons = chain === 'solana' ? solanaButtons : chain === 'bsc' ? bscButtons : baseButtons;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full mt-4">
      {buttons.map((button, index) => (
        <StarterButton
          key={button.title}
          {...button}
          className={index === 2 ? 'md:col-span-2 md:w-[calc(50%-0.25rem)] md:mx-auto' : ''}
        />
      ))}
    </div>
  );
};

export default StarterButtons;
