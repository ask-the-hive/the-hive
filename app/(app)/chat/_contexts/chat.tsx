"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';

import { Message, useChat as useAiChat } from 'ai/react';
import { Models } from '@/types/models';
import { usePrivy } from '@privy-io/react-auth';
import { generateId } from 'ai';
import { useUserChats } from '@/hooks';
import { ChainType } from '@/app/_contexts/chain-context';

import {
    SOLANA_GET_WALLET_ADDRESS_NAME,
    SOLANA_TRADE_NAME,
    SOLANA_STAKE_NAME,
    SOLANA_UNSTAKE_NAME,
    SOLANA_TRANSFER_NAME,
    SOLANA_DEPOSIT_LIQUIDITY_NAME,
    SOLANA_WITHDRAW_LIQUIDITY_NAME
} from '@/ai/action-names';

export enum ColorMode {
    LIGHT = 'light',
    DARK = 'dark',
}

// Define a type for tool results
type ToolResult<T> = {
    message: string;
    body?: T;
}

interface ChatContextType {
    messages: Message[];
    input: string;
    setInput: (input: string) => void;
    onSubmit: () => Promise<void>;
    isLoading: boolean;
    sendMessage: (message: string) => void;
    addToolResult: <T>(toolCallId: string, result: ToolResult<T>) => void;
    isResponseLoading: boolean;
    model: Models;
    setModel: (model: Models) => void;
    chain: ChainType;
    setChain: (chain: ChainType) => void;
    setChat: (chatId: string) => void;
    resetChat: () => void;
    chatId: string;
    inputDisabledMessage: string;
}

const ChatContext = createContext<ChatContextType>({
    messages: [],
    input: '',
    setInput: () => {},
    onSubmit: async () => {},
    isLoading: false,
    sendMessage: () => {},
    isResponseLoading: false,
    addToolResult: () => {},
    model: Models.OpenAI,
    setModel: () => {},
    chain: 'solana',
    setChain: () => {},
    setChat: () => {},
    resetChat: () => {},
    chatId: '',
    inputDisabledMessage: '',
});

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { user, getAccessToken } = usePrivy();

    const [chatId, setChatId] = useState<string>(generateId());
    const [isResponseLoading, setIsResponseLoading] = useState(false);
    const [model, setModel] = useState<Models>(Models.OpenAI);
    const [chain, setChain] = useState<ChainType>('solana');

    const { mutate } = useUserChats();

    const setChat = async (chatId: string) => {
        setChatId(chatId);
        const chat = await fetch(`/api/chats/${chatId}`, {
            headers: {
                Authorization: `Bearer ${await getAccessToken()}`,
            },
        });
        const chatData = await chat.json();
        if (chatData) {
            setMessages(chatData.messages);
            setChain(chatData.chain || 'solana'); // Set the chain from saved chat data
        }
    }

    const resetChat = () => {
        setChatId(generateId());
        setMessages([]);
    }

    const { messages, input, setInput, append, isLoading, addToolResult: addToolResultBase, setMessages } = useAiChat({
        maxSteps: 20,
        onResponse: () => {
            setIsResponseLoading(false);
        },
        api: `/api/chat/${chain}`,
        body: {
            model,
            modelName: model,
            userId: user?.id,
            chatId,
            chain,
        },
    });
    
    const addToolResult = <T,>(toolCallId: string, result: ToolResult<T>) => {
        addToolResultBase({
            toolCallId,
            result,
        })
    }

    useEffect(() => {
        const updateChat = async () => {
            if(messages.length > 0 && !isLoading) {
                const response = await fetch(`/api/chats/${chatId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                    },
                    body: JSON.stringify({
                        messages,
                        chain, // Include chain in saved chat data
                    }),
                });
                const data = await response.json();
                if(typeof data === 'object') {
                    mutate();
                }
            }
        };

        updateChat();
    }, [isLoading]);

    const onSubmit = async () => {
        if (!input.trim()) return;
        setIsResponseLoading(true);
        await append({
            role: 'user',
            content: input,
        });
        setInput('');
    }

    const sendMessage = async (message: string) => {
        setIsResponseLoading(true);
        await append({
            role: 'user',
            content: message,
        });
    }

    const inputDisabledMessage = useMemo(() => {
        if(messages.length === 0) return '';
        const lastMessage = messages[messages.length - 1];
        let message = lastMessage.toolInvocations?.map(toolInvocation => {
            if(toolInvocation.state === "result") return '';
            const toolName = toolInvocation.toolName.slice(toolInvocation.toolName.indexOf('-') + 1);
            switch(toolName) {
                case SOLANA_TRADE_NAME:
                    return `Complete or cancel your trade`;
                case SOLANA_TRANSFER_NAME:
                    return `Complete or cancel your transfer`;
                case SOLANA_STAKE_NAME:
                    return `Complete or cancel your stake`;
                case SOLANA_UNSTAKE_NAME:
                    return `Complete or cancel your unstake`;
                case SOLANA_DEPOSIT_LIQUIDITY_NAME:
                    return `Complete or cancel your deposit`;
                case SOLANA_WITHDRAW_LIQUIDITY_NAME:
                    return `Complete or cancel your withdraw`;
                case SOLANA_GET_WALLET_ADDRESS_NAME:
                    return `Connect your wallet`;
                case "bsc_transfer":
                    return `Complete or cancel your transfer`;
                default:
                    return '';
            }
        }).filter(message => message !== '').join(' and ');
        if(message) {
            message = message?.concat(' to continue');
        }
        return message || '';
    }, [messages])

    return (
        <ChatContext.Provider value={{ 
            messages, 
            input, 
            setInput, 
            onSubmit, 
            isLoading,
            sendMessage,
            isResponseLoading,
            addToolResult,
            model,
            setModel,
            chain,
            setChain,
            setChat,
            resetChat,
            chatId,
            inputDisabledMessage,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);