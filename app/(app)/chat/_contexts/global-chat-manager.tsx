"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface ChatThreadState {
    chatId: string;
    isLoading: boolean;
    isResponseLoading: boolean;
    chain: string;
}

interface GlobalChatManagerType {
    // Track all active chat threads and their states
    chatThreads: Map<string, ChatThreadState>;
    
    // Update a specific chat thread's loading state
    updateChatThreadState: (chatId: string, updates: Partial<ChatThreadState>) => void;
    
    // Remove a chat thread from tracking
    removeChatThread: (chatId: string) => void;
    
    // Check if any chat thread is currently loading
    hasAnyLoadingThread: boolean;
    
    // Get loading state for a specific chat
    getChatThreadState: (chatId: string) => ChatThreadState | undefined;
}

const GlobalChatManagerContext = createContext<GlobalChatManagerType>({
    chatThreads: new Map(),
    updateChatThreadState: () => {},
    removeChatThread: () => {},
    hasAnyLoadingThread: false,
    getChatThreadState: () => undefined,
});

interface GlobalChatManagerProviderProps {
    children: ReactNode;
}

export const GlobalChatManagerProvider: React.FC<GlobalChatManagerProviderProps> = ({ children }) => {
    const [chatThreads, setChatThreads] = useState<Map<string, ChatThreadState>>(new Map());

    const updateChatThreadState = useCallback((chatId: string, updates: Partial<ChatThreadState>) => {
        setChatThreads(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(chatId);
            
            if (existing) {
                newMap.set(chatId, { ...existing, ...updates });
            } else {
                // Initialize new thread if it doesn't exist
                newMap.set(chatId, {
                    chatId,
                    isLoading: false,
                    isResponseLoading: false,
                    chain: 'solana',
                    ...updates,
                });
            }
            
            return newMap;
        });
    }, []);

    const removeChatThread = useCallback((chatId: string) => {
        setChatThreads(prev => {
            const newMap = new Map(prev);
            newMap.delete(chatId);
            return newMap;
        });
    }, []);

    const hasAnyLoadingThread = chatThreads.size > 0 && 
        Array.from(chatThreads.values()).some(thread => thread.isLoading || thread.isResponseLoading);

    const getChatThreadState = useCallback((chatId: string) => {
        return chatThreads.get(chatId);
    }, [chatThreads]);

    return (
        <GlobalChatManagerContext.Provider value={{
            chatThreads,
            updateChatThreadState,
            removeChatThread,
            hasAnyLoadingThread,
            getChatThreadState,
        }}>
            {children}
        </GlobalChatManagerContext.Provider>
    );
};

export const useGlobalChatManager = () => useContext(GlobalChatManagerContext);
