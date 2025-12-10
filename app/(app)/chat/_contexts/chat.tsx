'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Message } from 'ai/react';
import { useChat as useAiChat } from '@ai-sdk/react';
import { Models } from '@/types/models';
import { usePrivy } from '@privy-io/react-auth';
import { generateId } from 'ai';
import { useUserChats } from '@/hooks';
import { ChainType } from '@/app/_contexts/chain-context';
import { useRouter, usePathname } from 'next/navigation';
import { useGlobalChatManager } from './global-chat-manager';
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
import * as Sentry from '@sentry/nextjs';

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
  chain: ChainType;
  setChain: (chain: ChainType) => void;
  setChat: (chatId: string) => void;
  resetChat: () => void;
  chatId: string;
  inputDisabledMessage: string;
  // New property to check if we can start a new chat
  canStartNewChat: boolean;
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
  chain: 'solana',
  setChain: () => {},
  setChat: () => {},
  resetChat: () => {},
  chatId: '',
  inputDisabledMessage: '',
  canStartNewChat: true,
  completedLendToolCallIds: [],
});

interface ChatProviderProps {
  children: ReactNode;
}

const getMessageToolInvocations = (message: Message | undefined): any[] => {
  if (!message) return [];

  if (message.parts && message.parts.length > 0) {
    return (message.parts as any[])
      .filter((part) => part && part.type === 'tool-invocation' && (part as any).toolInvocation)
      .map((part) => (part as any).toolInvocation);
  }

  const legacyToolInvocations = (message as any).toolInvocations as any[] | undefined;

  return legacyToolInvocations ?? [];
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, getAccessToken } = usePrivy();
  const { updateChatThreadState, removeChatThread } = useGlobalChatManager();
  const router = useRouter();
  const pathname = usePathname();
  const [completedLendToolCallIds, setCompletedLendToolCallIds] = useState<string[]>([]);

  const parseJsonSafely = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'ChatProvider',
          action: 'parseJsonSafely',
          status: response.status,
        },
      });
      return null;
    }
  };

  const [chatId, setChatId] = useState<string>(() => {
    const urlChatId = pathname.split('/').pop();
    return urlChatId || generateId();
  });

  useEffect(() => {
    const urlChatId = pathname.split('/').pop();
    if (urlChatId && urlChatId !== chatId) {
      setChatId(urlChatId);
    }
  }, [pathname, chatId]);

  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [model, setModel] = useState<Models>(Models.OpenAI);
  const [chain, setChain] = useState<ChainType>('solana');

  const isResettingRef = useRef(false);

  const { mutate } = useUserChats();

  const setChat = async (chatId: string) => {
    setChatId(chatId);
    const chat = await fetch(`/api/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    });
    const chatData = await parseJsonSafely(chat);
    if (chatData) {
      setMessages(chatData.messages);
      setChain(chatData.chain || 'solana');
    }
  };

  const resetChat = async () => {
    isResettingRef.current = true;

    removeChatThread(chatId);

    const newChatId = generateId();

    router.push(`/chat/${newChatId}`);

    setChatId(newChatId);
    setMessages([]);
    setInput('');
    setIsResponseLoading(false);

    updateChatThreadState(newChatId, {
      chatId: newChatId,
      isLoading: false,
      isResponseLoading: false,
      chain,
    });

    setTimeout(() => {
      isResettingRef.current = false;
    }, 100);
  };

  const {
    messages,
    input,
    setInput,
    append,
    /**
     * Hook status:
     *
     * - `submitted`: The message has been sent to the API and we're awaiting the start of the response stream.
     * - `streaming`: The response is actively streaming in from the API, receiving chunks of data.
     * - `ready`: The full response has been received and processed; a new user message can be submitted.
     * - `error`: An error occurred during the API request, preventing successful completion.
     */
    // status: 'submitted' | 'streaming' | 'ready' | 'error';
    status,
    addToolResult: addToolResultBase,
    setMessages,
  } = useAiChat({
    maxSteps: 20,
    onResponse: () => {
      setIsResponseLoading(false);
      updateChatThreadState(chatId, {
        isLoading: false,
        isResponseLoading: false,
      });
    },
    api: `/api/chat/${chain}`,
    body: {
      model,
      modelName: model,
      userId: user?.id,
      chatId,
      chain,
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          component: 'ChatProvider',
          action: 'chatError',
        },
      });
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (isLoading) {
      updateChatThreadState(chatId, {
        isLoading: true,
        isResponseLoading: true,
      });
    }
  }, [isLoading, chatId, updateChatThreadState]);

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

  useEffect(() => {
    updateChatThreadState(chatId, {
      chatId,
      isLoading,
      isResponseLoading,
      chain,
    });
  }, [chatId, isLoading, isResponseLoading, chain, updateChatThreadState]);

  useEffect(() => {
    return () => {
      removeChatThread(chatId);
    };
  }, [chatId, removeChatThread]);

  useEffect(() => {
    if (!isResettingRef.current) {
      setInput('');
      setIsResponseLoading(false);
    }
  }, [chatId, setInput]);

  useEffect(() => {
    if (chatId && !isResettingRef.current) {
      const loadExistingChat = async () => {
        try {
          const chat = await fetch(`/api/chats/${chatId}`, {
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
          });

          if (chat.ok) {
            const chatData = await parseJsonSafely(chat);
            if (chatData && chatData.messages && chatData.messages.length > 0) {
              setMessages(chatData.messages);
              setChain(chatData.chain || 'solana');
            }
          }
        } catch {
          console.log('New chat or chat not found:', chatId);
        }
      };

      loadExistingChat();
    }
  }, [chatId, getAccessToken, setMessages, setChain]);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = setTimeout(async () => {
      if (isResettingRef.current) return;
      if (messages.length === 0) return;
      if (status !== 'ready') return;

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          messages,
          chain,
        }),
      });
      const data = await parseJsonSafely(response);
      if (typeof data === 'object') {
        mutate();
      }
    }, 500); // debounce persistence to reduce repeated calls

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [messages, chatId, chain, getAccessToken, mutate, status]);

  const onSubmit = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput('');

    setIsResponseLoading(true);
    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });

    const appendPromise = append({
      role: 'user',
      content: userInput,
    });

    if (messages.length === 0) {
      (async () => {
        try {
          const response = await fetch(`/api/chats/${chatId}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: userInput,
                },
              ],
              chain,
            }),
          });

          if (response.ok) {
            mutate();
          }
        } catch (error) {
          console.error('Error creating new chat:', error);
          Sentry.captureException(error, {
            tags: {
              component: 'ChatProvider',
              action: 'createNewChat',
            },
          });
        }
      })();
    }

    await appendPromise;
  };

  const sendMessage = async (message: string) => {
    setIsResponseLoading(true);

    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: message,
    };

    const chatCreationPromise =
      messages.length === 0
        ? (async () => {
            try {
              const response = await fetch(`/api/chats/${chatId}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${await getAccessToken()}`,
                },
                body: JSON.stringify({
                  messages: [userMessage],
                  chain,
                }),
              });

              if (response.ok) {
                mutate();
              } else if (response.status === 409) {
                console.log('Chat already exists, refreshing list');
                mutate();
              } else {
                console.error('Error creating new chat:', response.status, response.statusText);
              }
            } catch (error) {
              console.error('Error creating new chat:', error);
            }
          })()
        : Promise.resolve();

    const aiResponsePromise = (async () =>
      await append({
        role: 'user',
        content: message,
      }))();

    await Promise.all([chatCreationPromise, aiResponsePromise]);
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
          case 'bsc_transfer':
            return `Complete or cancel your transfer`;
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

  const canStartNewChat = true;

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
        chain,
        setChain,
        setChat,
        resetChat,
        chatId,
        inputDisabledMessage,
        canStartNewChat,
        completedLendToolCallIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
