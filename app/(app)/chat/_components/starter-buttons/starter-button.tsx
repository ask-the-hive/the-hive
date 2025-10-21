'use client';

import React from 'react';

import { Button, Icon } from '@/components/ui';

import { useChat } from '../../_contexts/chat';

import { cn } from '@/lib/utils';

import { IconName } from '@/types';
import { Loader2 } from 'lucide-react';

interface Props {
  icon: IconName;
  title: string;
  description: string;
  prompt: string;
  className?: string;
}

const StarterButton: React.FC<Props> = ({ icon, title, description, prompt, className }) => {
  const { sendMessage, isResponseLoading, isLoading } = useChat();

  return (
    <Button
      className={cn(
        'flex items-center px-4 py-6 gap-2 text-sm text-neutral-600 dark:text-neutral-400 h-fit justify-start rounded-lg shadow-md',
        className,
      )}
      variant="outline"
      disabled={isResponseLoading || isLoading}
      onClick={() => sendMessage(prompt)}
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
            <p className="text-md2 font-bold text-neutral-100">{title}</p>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>
        {(isResponseLoading || isLoading) && (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
        )}
      </div>
    </Button>
  );
};

export default StarterButton;
