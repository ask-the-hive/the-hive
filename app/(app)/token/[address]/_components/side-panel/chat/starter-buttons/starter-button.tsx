'use client'

import React from 'react'

import { Button, Icon } from '@/components/ui';

import { useChat } from '../../../../_contexts';

import { cn } from '@/lib/utils';

import { IconName } from '@/types';

interface Props {
    icon: IconName
    title: string
    prompt: string,
    className?: string
}

const StarterButton: React.FC<Props> = ({ icon, title, prompt, className }) => {

    const { sendMessage } = useChat();

    return (
        <Button 
            className={cn(
                'flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 h-fit justify-start',
                className
            )}
            variant="outline"
            onClick={() => sendMessage(prompt)}
        >
            <div className="flex items-center gap-2 max-w-full">
                <Icon name={icon} className="w-4 h-4" />
                <p className="text-sm font-bold text-wrap text-left hidden lg:inline">
                    {title}
                </p>
            </div>
        </Button>
    )
}

export default StarterButton