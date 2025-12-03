'use client';

import React, { useRef, useEffect } from 'react';

import { ArrowUp } from 'lucide-react';

import Textarea from 'react-textarea-autosize';

import { Button, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui';

import { useEnterSubmit } from '../_hooks';

import { useChat } from '../_contexts/chat';

import { cn } from '@/lib/utils';

// import ModelSelector from '../../_components/chat/model-selector';
// import ChainSelector from '../../_components/chat/chain-selector';
import { usePrivy } from '@privy-io/react-auth';
import FollowUpSuggestions from './follow-up-suggestions';

type ChatInputProps = {
  placeholderText?: string;
};

const ChatInput: React.FC<ChatInputProps> = ({ placeholderText }) => {
  const { user } = usePrivy();

  const {
    input,
    setInput,
    onSubmit,
    // model,
    // setModel,
    // chain,
    // setChain,
    inputDisabledMessage,
    // messages,
    isLoading,
  } = useChat();

  const { onKeyDown } = useEnterSubmit({ onSubmit: onSubmit });

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if chat has started (has messages)
  // const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <FollowUpSuggestions />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={cn(
          // Base styles
          'w-full rounded-lg flex flex-col overflow-hidden transition-colors duration-200 ease-in-out border border-transparent shadow-md',
          // Light mode styles
          'bg-neutral-100 focus-within:border-brand-600',
          // Dark mode styles
          'dark:bg-neutral-700/50 dark:focus-within:border-brand-600',
          // Remove loading state styling that prevents new chat creation
        )}
      >
        <div className="relative flex items-center">
          <OptionalTooltip text={inputDisabledMessage}>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              placeholder={placeholderText || 'Ask the hive anything...'}
              className={cn(
                'w-full max-h-40 resize-none bg-transparent px-5 pt-5 pb-5 pr-14 text-[17px] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-600 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:outline-none',
                'dark:placeholder:text-neutral-400',
              )}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              // Only disable input for tool invocations, not for loading state
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
                    // Only disable submit button for empty input or tool invocations
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
