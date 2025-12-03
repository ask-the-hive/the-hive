'use client';

import React, { useEffect, useMemo, useState } from 'react';

import ChatInput from './input';
import StarterButtons from './starter-buttons';

import Logo from '@/components/ui/logo';
import { useChat } from '../_contexts/chat';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const EmptyChat: React.FC = () => {
  const promptPool = useMemo(
    () => [
      'Help me stake SOL',
      'How to earn in DeFi',
      'Compare lending options',
      'Best staking yields',
      'Where to deposit stablecoins',
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { setInput, sendMessage, isLoading, inputDisabledMessage } = useChat();

  // Rotate prompts every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % promptPool.length);
        setIsFading(false);
      }, 500);
    }, 6000);
    return () => clearInterval(id);
  }, [promptPool.length]);

  const tip = promptPool[activeIndex];
  const chipOne = promptPool[(activeIndex + 1) % promptPool.length];
  const chipTwo = promptPool[(activeIndex + 2) % promptPool.length];
  const chips = [chipOne, chipTwo];

  const handleChipClick = (prompt: string) => {
    if (isLoading || inputDisabledMessage) return;
    setInput(prompt);
    sendMessage(prompt);
  };

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
        <div className={cn('w-full transition-opacity duration-300')}>
          <ChatInput placeholderText={`Tip: ${tip}`} />
        </div>

        <div
          className={cn(
            'flex w-full items-center justify-center gap-2 transition-opacity duration-300',
            isFading ? 'opacity-0' : 'opacity-100',
          )}
        >
          {chips.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                'border border-neutral-200 dark:border-neutral-700',
              )}
              disabled={isLoading || !!inputDisabledMessage}
              onClick={() => handleChipClick(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <StarterButtons />
      </div>
    </div>
  );
};

export default EmptyChat;
