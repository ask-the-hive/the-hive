'use client';

import React from 'react';

import { Button, Icon } from '@/components/ui';

import { useChat } from '../../_contexts/chat';

import { cn } from '@/lib/utils';

import { IconName } from '@/types';

interface Props {
  icon: IconName;
  title: string;
  description: string;
  prompt: string;
  className?: string;
}

const StarterButton: React.FC<Props> = ({ icon, title, description, prompt, className }) => {
  const { sendMessage } = useChat();

  return (
    <Button
      className={cn(
        'flex items-center p-4 gap-2 text-sm text-neutral-600 dark:text-neutral-400 h-fit justify-start',
        className,
      )}
      variant="outline"
      onClick={() => sendMessage(prompt)}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="w-5 h-5" />
          <p className="text-md2 font-bold">{title}</p>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 hidden md:block">
          {description}
        </p>
      </div>
    </Button>
  );
};

export default StarterButton;
