'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import Textarea from 'react-textarea-autosize';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, Button } from '@/components/ui';
import { useEnterSubmit } from '../_hooks';
import { useChat } from '../_contexts/chat';
import { cn } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';

const PROMPT_POOL = [
  'Help me stake SOL',
  'How to earn in DeFi',
  'Compare lending options',
  'Best staking yields',
  'Where to deposit stablecoins',
];

const ChatInput: React.FC = () => {
  const { user } = usePrivy();
  const { input, setInput, onSubmit, inputDisabledMessage, isLoading, messages } = useChat();
  const { onKeyDown } = useEnterSubmit({ onSubmit: onSubmit });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [rotatedPrompts, setRotatedPrompts] = useState(PROMPT_POOL);

  useEffect(() => {
    const storageKey = 'chat-tip-rotation-index';
    const lastIndexRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const lastIndex = lastIndexRaw ? parseInt(lastIndexRaw, 10) : -1;
    const nextIndex = Number.isFinite(lastIndex) ? (lastIndex + 1) % PROMPT_POOL.length : 0;
    const rotated = PROMPT_POOL.map(
      (_prompt, idx) => PROMPT_POOL[(nextIndex + idx) % PROMPT_POOL.length],
    );

    setRotatedPrompts(rotated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, `${nextIndex}`);
    }
  }, []);

  const tipPrompt = rotatedPrompts[0] || 'Ask the hive anything...';
  const hasMessages = (messages || []).length > 0;
  const placeholder = hasMessages ? 'Ask the hive anything...' : `Tip: ${tipPrompt}`;

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={cn(
          'w-full rounded-lg flex flex-col overflow-hidden transition-colors duration-200 ease-in-out border border-transparent shadow-md',
          'bg-neutral-100 focus-within:border-brand-600',
          'dark:bg-neutral-700/50 dark:focus-within:border-brand-600',
        )}
      >
        <div className="relative flex items-center">
          <OptionalTooltip text={inputDisabledMessage}>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className={cn(
                'w-full max-h-40 resize-none bg-transparent px-5 pt-5 pb-5 pr-14 text-[17px] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-600 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:outline-none',
                'dark:placeholder:text-neutral-400',
              )}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              disabled={inputDisabledMessage !== '' || isLoading}
              autoFocus
            />
          </OptionalTooltip>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      input.trim() === '' || inputDisabledMessage !== '' || !user || isLoading
                    }
                    variant="ghost"
                    className="h-8 w-8"
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full transition-colors',
                        input.trim().length > 0
                          ? 'bg-brand-600 hover:bg-brand-700'
                          : 'bg-brand-700 dark:bg-brand-700',
                      )}
                    >
                      <ArrowUp className="w-4 h-4 text-neutral-100" />
                    </div>
                    <span className="sr-only">Send message</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </form>
    </div>
  );
};

const OptionalTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  if (text === '') return children;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side="top">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChatInput;
