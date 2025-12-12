'use client';

import React, { useEffect, useState } from 'react';

import { Button, Icon } from '@/components/ui';

import { useChat } from '../../_contexts/chat';

import { cn } from '@/lib/utils';

import { IconName } from '@/types';
import { Loader2 } from 'lucide-react';
import posthog from 'posthog-js';

interface Props {
  icon: IconName;
  title: string;
  description: string;
  prompt: string;
  className?: string;
  eventName: string;
}

const StarterButton: React.FC<Props> = ({
  icon,
  title,
  description,
  prompt,
  className,
  eventName,
}) => {
  const { sendMessage, isResponseLoading, isLoading } = useChat();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isResponseLoading && !isLoading) {
      setPending(false);
    }
  }, [isResponseLoading, isLoading]);

  return (
    <Button
      className={cn(
        'flex items-center py-3 px-3 md:py-4 md:px-4 gap-2 text-xs md:text-sm text-neutral-600 dark:text-neutral-400 h-fit justify-start rounded-lg shadow-md min-w-0',
        'hover:!shadow-lg hover:!shadow-brand-600/20 dark:hover:!shadow-brand-600/30',
        'hover:!bg-brand-50 dark:hover:!bg-neutral-700',
        'transition-all duration-200 ease-in-out',
        className,
      )}
      variant="outline"
      disabled={isResponseLoading || isLoading || pending}
      onClick={() => {
        setPending(true);
        sendMessage(prompt);
        posthog.capture(eventName);
      }}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <div
          className={cn(
            'flex flex-col gap-1 transition-opacity duration-200',
            (isResponseLoading || isLoading) && 'opacity-90',
          )}
        >
          <div className="flex items-center gap-2">
            <Icon name={icon} className="w-5 h-5 text-neutral-100" />
            <p className="text-sm md:text-base font-semibold text-neutral-100 leading-tight break-words">
              {title}
            </p>
          </div>
          <p className="text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400 leading-snug line-clamp-2 break-words">
            {description}
          </p>
        </div>
        {(pending || isResponseLoading || isLoading) && (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
        )}
      </div>
    </Button>
  );
};

export default StarterButton;
