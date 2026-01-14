'use client';

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import EmptyChat from './empty';
import Messages from './messages';
import ChatInput from './input';
import { LoadingMessage } from '@/app/(app)/_components/chat';
import { useChat } from '../_contexts/chat';
import { useState } from 'react';

const Chat: React.FC = () => {
  const searchParams = useSearchParams();
  const { messages, sendMessage, isResponseLoading } = useChat();
  const hasProcessedInitialMessage = useRef(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    const initialMessage = searchParams.get('message');

    if (initialMessage && messages.length === 0 && !hasProcessedInitialMessage.current) {
      setPrefillLoading(true);
      hasProcessedInitialMessage.current = true;
      sendMessage(decodeURIComponent(initialMessage));
    }
  }, [searchParams, messages.length, sendMessage]);

  useEffect(() => {
    if (messages.length > 0 || !isResponseLoading) {
      setPrefillLoading(false);
    }
  }, [messages.length, isResponseLoading]);

  const cleanedMessages = messages.filter((message) => message.role !== 'system');
  const showInitialLoading = cleanedMessages.length === 0 && (isResponseLoading || prefillLoading);

  return (
    <>
      <div className="h-full w-full flex flex-col items-center relative">
        <div className="h-full w-full flex flex-col justify-between max-w-full md:max-w-4xl">
          <div className="flex-1 overflow-hidden h-0 flex flex-col max-w-full">
            <AnimatePresence mode="wait">
              {showInitialLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full"
                >
                  <LoadingMessage />
                  <ChatInput />
                </motion.div>
              ) : cleanedMessages.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center h-full"
                >
                  <EmptyChat />
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col h-full w-full"
                >
                  <Messages messages={cleanedMessages} />
                  <ChatInput />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
