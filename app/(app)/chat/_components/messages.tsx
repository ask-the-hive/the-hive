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
  const { isResponseLoading } = useChat();

  const { scrollRef, messagesRef, scrollToBottom } = useScrollAnchor();

  // Track previous values to detect new messages/responses
  const prevMessageCountRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isResponseLoading);

  useEffect(() => {
    const messageCountChanged = messages.length > prevMessageCountRef.current;
    const loadingStarted = isResponseLoading && !prevIsLoadingRef.current;

    // Only scroll when a new message is added or assistant starts responding
    if (messageCountChanged || loadingStarted) {
      scrollToBottom();
    }

    // Update refs for next render
    prevMessageCountRef.current = messages.length;
    prevIsLoadingRef.current = isResponseLoading;
  }, [messages.length, isResponseLoading, scrollToBottom]);

  return (
    <div
      className="flex-1 h-0 flex flex-col w-full overflow-y-auto max-w-full no-scrollbar"
      ref={scrollRef}
    >
      <div className="messages-container" ref={messagesRef}>
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            className={messageClassName}
            ToolComponent={ToolInvocation}
            previousMessage={index > 0 ? messages[index - 1] : undefined}
            nextMessage={index < messages.length - 1 ? messages[index + 1] : undefined}
            isLatestAssistant={index === messages.length - 1 && message.role === 'assistant'}
          />
        ))}
        {isResponseLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <LoadingMessage />
        )}
      </div>
    </div>
  );
};

export default Messages;
