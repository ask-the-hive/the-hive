'use client';

import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Message, useChat as useAiChat } from 'ai/react';
import { Models } from '@/types/models';
import {
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_DEPOSIT_LIQUIDITY_NAME,
  SOLANA_WITHDRAW_LIQUIDITY_NAME,
  SOLANA_LEND_ACTION,
} from '@/ai/action-names';
import type { TokenChatData } from '@/types';
import posthog from 'posthog-js';

export enum ColorMode {
  LIGHT = 'light',
  DARK = 'dark',
}

type ToolResult<T> = {
  message: string;
  body?: T;
};

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
  resetChat: () => void;
  inputDisabledMessage: string;
  completedLendToolCallIds: string[];
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
  resetChat: () => {},
  inputDisabledMessage: '',
  completedLendToolCallIds: [],
});

interface ChatProviderProps {
  token: TokenChatData;
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ token, children }) => {
  const { user } = usePrivy();

  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [model, setModel] = useState<Models>(Models.OpenAI);
  const [completedLendToolCallIds, setCompletedLendToolCallIds] = useState<string[]>([]);

  const resetChat = () => {
    setMessages([]);
  };

  const {
    messages,
    input,
    setInput,
    append,
    isLoading,
    addToolResult: addToolResultBase,
    setMessages,
  } = useAiChat({
    maxSteps: 20,
    onResponse: () => {
      setIsResponseLoading(false);
    },
    api:
      token.chain === 'bsc'
        ? `/api/chat/bsc-token`
        : token.chain === 'base'
          ? `/api/chat/base-token`
          : `/api/chat/token`,
    body: {
      model,
      modelName: model,
      userId: user?.id,
      token,
    },
  });

  const addToolResult = <T,>(toolCallId: string, result: ToolResult<T>) => {
    const lastMessage = messages[messages.length - 1];
    const toolInvocations = getMessageToolInvocations(lastMessage);
    const lendInvocation = toolInvocations.find((toolInvocation) =>
      toolInvocation.toolName.includes(SOLANA_LEND_ACTION),
    );

    if (lendInvocation && (result as any)?.body?.status === 'complete') {
      setCompletedLendToolCallIds((prev) =>
        prev.includes(toolCallId) ? prev : [...prev, toolCallId],
      );
    }

    addToolResultBase({
      toolCallId,
      result,
    });
  };

  const onSubmit = async () => {
    if (!input.trim()) return;
    setIsResponseLoading(true);
    await append({
      role: 'user',
      content: input,
    });
    setInput('');
  };

  const sendMessage = async (message: string) => {
    posthog.capture('agent_queried', {
      message,
    });
    setIsResponseLoading(true);
    await append({
      role: 'user',
      content: message,
    });
  };

  const getMessageToolInvocations = (message: any): any[] => {
    if (!message) return [];

    if (message.parts && message.parts.length > 0) {
      return (message.parts as any[])
        .filter((part: any) => part && part.type === 'tool-invocation' && part.toolInvocation)
        .map((part: any) => part.toolInvocation);
    }

    const legacyToolInvocations = (message as any).toolInvocations as any[] | undefined;

    return legacyToolInvocations ?? [];
  };

  const inputDisabledMessage = useMemo(() => {
    if (messages.length === 0) return '';
    const lastMessage = messages[messages.length - 1];
    const toolInvocations = getMessageToolInvocations(lastMessage);

    let message = toolInvocations
      .map((toolInvocation) => {
        if (toolInvocation.state === 'result') return '';
        const toolName = toolInvocation.toolName.slice(toolInvocation.toolName.indexOf('-') + 1);
        switch (toolName) {
          case SOLANA_TRADE_ACTION:
            return `Complete or cancel your trade`;
          case SOLANA_TRANSFER_NAME:
            return `Complete or cancel your transfer`;
          case SOLANA_STAKE_ACTION:
            return `Complete or cancel your stake`;
          case SOLANA_UNSTAKE_ACTION:
            return `Complete or cancel your unstake`;
          case SOLANA_DEPOSIT_LIQUIDITY_NAME:
            return `Complete or cancel your deposit`;
          case SOLANA_WITHDRAW_LIQUIDITY_NAME:
            return `Complete or cancel your withdraw`;
          case SOLANA_GET_WALLET_ADDRESS_ACTION:
            return `Connect your wallet`;
          default:
            return '';
        }
      })
      .filter((message) => message !== '')
      .join(' and ');
    if (message) {
      message = message?.concat(' to continue');
    }
    return message || '';
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
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
        resetChat,
        inputDisabledMessage,
        completedLendToolCallIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
