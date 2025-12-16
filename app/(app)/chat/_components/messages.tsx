'use client';

import React, { useEffect, useRef } from 'react';
import { Message, LoadingMessage } from '@/app/(app)/_components/chat';
import ToolInvocation from './tools';
import { useScrollAnchor } from '@/app/(app)/chat/_hooks';
import { useChat } from '../_contexts/chat';
import type { Message as MessageType } from 'ai';

interface Props {
  messages: MessageType[];
  messageClassName?: string;
}

const Messages: React.FC<Props> = ({ messages, messageClassName }) => {
  const { isResponseLoading, isLoading } = useChat();
  const { scrollRef, messagesRef, scrollToBottom } = useScrollAnchor();
  const prevMessageCountRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isResponseLoading);

  useEffect(() => {
    const messageCountChanged = messages.length > prevMessageCountRef.current;
    const loadingStarted = (isResponseLoading || isLoading) && !prevIsLoadingRef.current;

    if (messageCountChanged || loadingStarted) {
      scrollToBottom();
    }

    prevMessageCountRef.current = messages.length;
    prevIsLoadingRef.current = isResponseLoading || isLoading;
  }, [messages.length, isResponseLoading, isLoading, scrollToBottom]);

  const visibleMessages = messages.filter((message) => {
    const annotations = message.annotations as any[] | undefined;
    if (!annotations) return true;

    return !annotations.some((a) => a && typeof a === 'object' && (a as any).internal);
  });

  return (
    <div
      className="flex-1 h-0 flex flex-col w-full overflow-y-auto max-w-full no-scrollbar"
      ref={scrollRef}
    >
      <div className="messages-container" ref={messagesRef}>
        {visibleMessages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            className={messageClassName}
            ToolComponent={ToolInvocation}
            previousMessage={index > 0 ? visibleMessages[index - 1] : undefined}
            nextMessage={
              index < visibleMessages.length - 1 ? visibleMessages[index + 1] : undefined
            }
            isLatestAssistant={index === visibleMessages.length - 1 && message.role === 'assistant'}
          />
        ))}
        {(isResponseLoading || isLoading) &&
          messages[messages.length - 1]?.role !== 'assistant' && <LoadingMessage />}
      </div>
    </div>
  );
};

export default Messages;
