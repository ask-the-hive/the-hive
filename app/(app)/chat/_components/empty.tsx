'use client';

import React from 'react';

import ChatInput from './input';
import StarterButtons from './starter-buttons';

import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import { useChat } from '../_contexts/chat';

const EmptyChat: React.FC = () => {
  const { chain } = useChat();

  const chainName = chain === 'solana' ? 'Solana' : chain === 'bsc' ? 'BSC' : 'Base';

  return (
    <div className={cn('flex flex-col items-center justify-center w-full h-full px-4 relative')}>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4 md:gap-8 relative z-10">
        <div className="flex flex-col gap-4 items-center justify-center">
          <Logo className="w-20 h-20" />
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-center text-2xl">
              How can <span className="text-brand-600 font-bold inline">We</span> help you?
            </h1>
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Orchestrate a hive mind of DeFi Agents to act on {chainName}
            </p>
          </div>
        </div>
        <ChatInput />

        <StarterButtons />
      </div>
    </div>
  );
};

export default EmptyChat;
