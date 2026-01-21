'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import EmptyChat from './empty';
import Messages from './messages';
import ChatInput from './input';
import { LoadingMessage } from '@/app/(app)/_components/chat';
import { useChat } from '../_contexts/chat';
import ConciergeModal from './concierge-modal';

const Chat: React.FC = () => {
  const searchParams = useSearchParams();
  const { messages, sendMessage, isResponseLoading } = useChat();
  const hasProcessedInitialMessage = useRef(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const hasShownConciergeForThisSession = useRef(false);

  useEffect(() => {
    const initialMessage = searchParams.get('message');
    const source = searchParams.get('source');

    if (initialMessage && messages.length === 0 && !hasProcessedInitialMessage.current) {
      setPrefillLoading(true);
      hasProcessedInitialMessage.current = true;
      let messageToSend = initialMessage;
      try {
        messageToSend = decodeURIComponent(initialMessage);
      } catch {
        // noop: `initialMessage` may already be decoded (or contain a raw `%`)
      }
      sendMessage(messageToSend, { skipWalletPrompt: source === 'shortcut' });
    }
  }, [searchParams, messages.length, sendMessage]);

  useEffect(() => {
    if (messages.length > 0 || !isResponseLoading) {
      setPrefillLoading(false);
    }
  }, [messages.length, isResponseLoading]);

  // Show concierge modal every time user comes from home page after hitting "Enter"
  useEffect(() => {
    const cleanedMessages = messages.filter((message) => message.role !== 'system');
    
    // Check if user came from home page
    const shouldShowConcierge = typeof window !== 'undefined' 
      ? sessionStorage.getItem('showConciergeFromHome') === 'true'
      : false;

    // Show modal every time: user came from home, no messages, and not loading
    if (shouldShowConcierge && cleanedMessages.length === 0 && !isResponseLoading && !prefillLoading && !hasShownConciergeForThisSession.current) {
      setShowConcierge(true);
      hasShownConciergeForThisSession.current = true;
      // Clear the flag after a delay to ensure modal shows
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('showConciergeFromHome');
        }
      }, 100);
    } else if (!shouldShowConcierge && !hasShownConciergeForThisSession.current) {
      // Only hide if user didn't come from home page and we haven't shown it yet
      setShowConcierge(false);
    }
    
    // Reset the ref when messages appear
    if (cleanedMessages.length > 0) {
      hasShownConciergeForThisSession.current = false;
    }
  }, [messages.length, isResponseLoading, prefillLoading]);

  const handleConciergeAction = (action: 'stake' | 'lend' | 'explore') => {
    // Send appropriate message based on action
    let message = '';
    if (action === 'stake') {
      message = 'Find me the best staking yields on Solana';
    } else if (action === 'lend') {
      message = 'Show me the best lending pools on Solana';
    } else {
      // Explore & Learn - just close the modal, don't send a message
      setShowConcierge(false);
      hasShownConciergeForThisSession.current = false;
      return;
    }

    sendMessage(message);
    hasShownConciergeForThisSession.current = false;

    // Scroll to results after messages appear - wait for response to start loading
    const scrollToResults = () => {
      // Find the messages container and scroll to it smoothly
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Also try to scroll the scrollable parent container
      const scrollableParent = document.querySelector('[class*="overflow-y-auto"]');
      if (scrollableParent) {
        scrollableParent.scrollTo({ top: scrollableParent.scrollHeight, behavior: 'smooth' });
      }
    };

    // Try scrolling multiple times as content loads
    setTimeout(scrollToResults, 800);
    setTimeout(scrollToResults, 1500);
    setTimeout(scrollToResults, 2500);
  };

  const handleCloseConcierge = () => {
    setShowConcierge(false);
    hasShownConciergeForThisSession.current = false;
  };

  const cleanedMessages = messages.filter((message) => message.role !== 'system');
  const showInitialLoading = cleanedMessages.length === 0 && (isResponseLoading || prefillLoading);

  return (
    <>
      <ConciergeModal
        isOpen={showConcierge}
        onClose={handleCloseConcierge}
        onActionSelect={handleConciergeAction}
      />
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
