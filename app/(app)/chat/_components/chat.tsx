'use client';

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import EmptyChat from './empty';
import Messages from './messages';
import ChatInput from './input';
import { LoadingMessage } from '@/app/(app)/_components/chat';
import { useChat } from '../_contexts/chat';

const Chat: React.FC = () => {
  const searchParams = useSearchParams();
  const { messages, sendMessage, isResponseLoading } = useChat();
  const hasProcessedInitialMessage = useRef(false);

  useEffect(() => {
    const initialMessage = searchParams.get('message');

    if (initialMessage && messages.length === 0 && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      sendMessage(decodeURIComponent(initialMessage));
    }
  }, [searchParams, messages.length, sendMessage]);

  const cleanedMessages = messages.filter((message) => message.role !== 'system');
  const showInitialLoading = cleanedMessages.length === 0 && isResponseLoading;

  return (
    <>
      <div className="h-full w-full flex flex-col items-center relative">
        <div className="h-full w-full flex flex-col justify-between max-w-full md:max-w-4xl">
          <div className="flex-1 overflow-hidden h-0 flex flex-col max-w-full">
            {showInitialLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <LoadingMessage />
                <ChatInput />
              </div>
            ) : cleanedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <EmptyChat />
              </div>
            ) : (
              <>
                <Messages messages={cleanedMessages} />
                <ChatInput />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
