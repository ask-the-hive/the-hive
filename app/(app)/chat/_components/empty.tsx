'use client';

import React, { useMemo } from 'react';

import ChatInput from './input';
import StarterButtons from './starter-buttons';

import Logo from '@/components/ui/logo';

const promptPool = [
  'Help me stake SOL',
  'How to earn in DeFi',
  'Compare lending options',
  'Best staking yields',
  'Where to deposit stablecoins',
];

const EmptyChat: React.FC = () => {
  const tip = useMemo(() => promptPool[Math.floor(Math.random() * promptPool.length)], []);

  return (
    <div className="flex flex-col items-center justify-start md:justify-center w-full h-full px-4 pt-0 relative overflow-y-auto">
      <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-4 md:gap-8 relative z-10 pb-8">
        <div className="flex flex-col gap-4 items-center justify-center">
          <Logo className="w-20 h-20" />
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-center text-2xl">
              How can <span className="text-brand-600 font-bold inline">We</span> help you?
            </h1>
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Discover yields, compare options, and act through a single agent interface.
            </p>
          </div>
        </div>
        <div className="w-full transition-opacity duration-300">
          <ChatInput placeholderText={`Tip: ${tip}`} />
        </div>

        <StarterButtons />
      </div>
    </div>
  );
};

export default EmptyChat;
