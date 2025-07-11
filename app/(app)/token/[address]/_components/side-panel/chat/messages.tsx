'use client';

import React from 'react'

import { LoadingMessage, Message } from '@/app/(app)/_components/chat';

import { useScrollAnchor } from '@/app/(app)/chat/_hooks';

import { useChat } from '@/app/(app)/token/[address]/_contexts/use-chat';
import Tool from './tool';

import type { TokenChatData } from '@/types';

interface Props {
    messageClassName?: string;
    token: TokenChatData;
}

const Messages: React.FC<Props> = ({ messageClassName, token }) => {

    const { messages, isResponseLoading } = useChat();

    const { scrollRef, messagesRef } = useScrollAnchor();
    
    // useEffect(() => {
    //     scrollToBottom();
    // }, [messages, scrollToBottom]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col w-full justify-center items-center" ref={scrollRef}>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    Start chatting with your token!
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-0 flex flex-col w-full overflow-y-auto max-w-full no-scrollbar" ref={scrollRef}>
            <div className="messages-container" ref={messagesRef}>
                {messages.map((message, index) => (
                    <Message 
                        key={message.id} 
                        message={message} 
                        className={messageClassName} 
                        previousMessage={index > 0 ? messages[index - 1] : undefined} 
                        nextMessage={index < messages.length - 1 ? messages[index + 1] : undefined}
                        compressed={true}
                        ToolComponent={({ tool }) => <Tool tool={tool} token={token} />}
                    />
                ))}
                {isResponseLoading && <LoadingMessage compressed />}
            </div>
        </div>
    )
}

export default Messages;