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
import { useGlobalChatManager } from './global-chat-manager';
import { useRouter, usePathname } from 'next/navigation';
import {
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_DEPOSIT_LIQUIDITY_NAME,
  SOLANA_WITHDRAW_LIQUIDITY_NAME,
} from '@/ai/action-names';
import * as Sentry from '@sentry/nextjs';

const CHAT_CACHE_PREFIX = 'hive-chat-cache:';
const CHAT_CACHE_TTL_MS = 60 * 60 * 1000;

export enum ColorMode {
  LIGHT = 'light',
  DARK = 'dark',
}

// Define a type for tool results
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
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  input: '',
  setInput: () => { },
  onSubmit: async () => { },
  isLoading: false,
  sendMessage: () => { },
  isResponseLoading: false,
  addToolResult: () => { },
  model: Models.OpenAI,
  setModel: () => { },
  chain: 'solana',
  setChain: () => { },
  setChat: () => { },
  resetChat: () => { },
  chatId: '',
  inputDisabledMessage: '',
  canStartNewChat: true,
});

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, getAccessToken } = usePrivy();
  const { updateChatThreadState, removeChatThread } = useGlobalChatManager();
  const router = useRouter();
  const pathname = usePathname();

  // Extract chatId from URL or generate new one
  const [chatId, setChatId] = useState<string>(() => {
    const urlChatId = pathname.split('/').pop();
    return urlChatId || generateId();
  });

  // Update chatId when URL changes
  useEffect(() => {
    const urlChatId = pathname.split('/').pop();
    if (urlChatId && urlChatId !== chatId) {
      setChatId(urlChatId);
    }
  }, [pathname, chatId]);

  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [model, setModel] = useState<Models>(Models.OpenAI);
  const [chain, setChain] = useState<ChainType>('solana');

  // Track if we're currently resetting to prevent state conflicts
  const isResettingRef = useRef(false);
  const isHydratingRef = useRef(false);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const lastHydratedCacheRef = useRef<string | null>(null);

  const { mutate } = useUserChats();

  const loadCachedChat = (id: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(`${CHAT_CACHE_PREFIX}${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { messages: Message[]; chain?: ChainType; cachedAt: number };
      if (!parsed || !Array.isArray(parsed.messages)) return null;
      if (Date.now() - parsed.cachedAt > CHAT_CACHE_TTL_MS) return null;
      lastHydratedCacheRef.current = JSON.stringify(parsed.messages);
      return parsed;
    } catch {
      return null;
    }
  };

  const persistCachedChat = (id: string, payload: { messages: Message[]; chain: ChainType }) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `${CHAT_CACHE_PREFIX}${id}`,
        JSON.stringify({ ...payload, cachedAt: Date.now() }),
      );
    } catch (error) {
      console.warn('Unable to cache chat locally:', error);
    }
  };

  const setChat = async (chatId: string) => {
    setChatId(chatId);
    const cached = loadCachedChat(chatId);
    if (cached) {
      setMessages(cached.messages);
      setChain(cached.chain || 'solana');
    }
    // Always revalidate in background to avoid stale data
    fetch(`/api/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((chatData) => {
        if (chatData) {
          setMessages(chatData.messages);
          setChain(chatData.chain || 'solana'); // Set the chain from saved chat data
          persistCachedChat(chatId, { messages: chatData.messages, chain: chatData.chain || 'solana' });
        }
      })
      .catch((error) => {
        Sentry.captureException(error, {
          tags: {
            component: 'ChatProvider',
            action: 'hydrateSetChat',
          },
        });
      });
  };

  const resetChat = async () => {
    // Set resetting flag to prevent state conflicts
    isResettingRef.current = true;

    // Remove the current chat from global tracking
    removeChatThread(chatId);

    const newChatId = generateId();

    // Navigate to the new chat URL
    router.push(`/chat/${newChatId}`);

    // Update local state
    setChatId(newChatId);

    // Clear all chat state
    setMessages([]);
    setInput('');
    setIsResponseLoading(false);

    // Initialize the new chat in global tracking
    updateChatThreadState(newChatId, {
      chatId: newChatId,
      isLoading: false,
      isResponseLoading: false,
      chain,
    });

    // Clear resetting flag after a short delay to ensure state is stable
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
      // Update global state when response is complete
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

  // Handle isLoading state changes from useAiChat hook
  useEffect(() => {
    if (isLoading) {
      // AI is actively processing, update global state
      updateChatThreadState(chatId, {
        isLoading: true,
        isResponseLoading: true,
      });
    }
  }, [isLoading, chatId, updateChatThreadState]);

  const addToolResult = <T,>(toolCallId: string, result: ToolResult<T>) => {
    addToolResultBase({
      toolCallId,
      result,
    });
  };

  // Initialize chat thread in global manager and update when loading states change
  useEffect(() => {
    updateChatThreadState(chatId, {
      chatId,
      isLoading,
      isResponseLoading,
      chain,
    });
  }, [chatId, isLoading, isResponseLoading, chain, updateChatThreadState]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      removeChatThread(chatId);
    };
  }, [chatId, removeChatThread]);

  // Clear input and loading states when chatId changes (new chat)
  useEffect(() => {
    if (!isResettingRef.current) {
      setInput('');
      setIsResponseLoading(false);
    }
  }, [chatId, setInput]);

  // Load chat data when chatId changes (for existing chats)
  useEffect(() => {
    if (chatId && !isResettingRef.current) {
      // Check if this is an existing chat by trying to load it
      const loadExistingChat = async () => {
        isHydratingRef.current = true;
        const cached = loadCachedChat(chatId);
        if (cached) {
          setMessages(cached.messages);
          setChain(cached.chain || 'solana');
        }
        try {
          const chat = await fetch(`/api/chats/${chatId}`, {
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
            },
          });

          if (chat.ok) {
            const chatData = await chat.json();
            if (chatData && chatData.messages && chatData.messages.length > 0) {
              // This is an existing chat, load its data
              setMessages(chatData.messages);
              setChain(chatData.chain || 'solana');
              persistCachedChat(chatId, {
                messages: chatData.messages,
                chain: chatData.chain || 'solana',
              });
            }
          }
        } catch {
          // Chat doesn't exist yet, this is fine for new chats
          console.log('New chat or chat not found:', chatId);
        } finally {
          isHydratingRef.current = false;
        }
      };

      loadExistingChat();
    }
  }, [chatId, getAccessToken, setMessages, setChain]);

  useEffect(() => {
    if (!chatId || messages.length === 0) return;
    if (isResettingRef.current) return;
    if (isHydratingRef.current) return;
    if (status !== 'ready') return;

    const payload = JSON.stringify({ messages, chain });
    if (payload === lastSavedPayloadRef.current) return;
    if (payload === lastHydratedCacheRef.current) {
      // Already hydrated from cache; still persist for freshness
      persistCachedChat(chatId, { messages, chain });
      return;
    }

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: payload,
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data === 'object') {
            lastSavedPayloadRef.current = payload;
            persistCachedChat(chatId, { messages, chain });
            mutate();
          }
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: 'ChatProvider',
            action: 'saveChat',
          },
        });
      }
    }, 700); // debounce to avoid spamming save during streaming

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [messages, chatId, chain, status, getAccessToken, mutate]);

  const onSubmit = async () => {
    if (!input.trim()) return;

    // Clear input immediately after validation
    const userInput = input;
    setInput('');

    // If this is the first message in a new chat, create the chat entry immediately
    if (messages.length === 0) {
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
          // Refresh the chats list to show the new chat immediately
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
    }

    setIsResponseLoading(true);
    // Update global state when starting a new message
    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });
    await append({
      role: 'user',
      content: userInput,
    });
  };

  const sendMessage = async (message: string) => {
    setIsResponseLoading(true);

    // Update global state immediately when starting a new message
    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });

    // Optimistically add the user message to trigger UI transition immediately
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: message,
    };

    // If this is the first message in a new chat, create the chat entry in parallel
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
              // Refresh the chats list to show the new chat immediately
              mutate();
            } else if (response.status === 409) {
              // Chat already exists, this is fine - just refresh the list
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

    // Start the AI response in parallel with chat creation
    // append() will add the user message, so we need to remove our optimistic one first
    const aiResponsePromise = (async () =>
      await append({
        role: 'user',
        content: message,
      }))();

    // Wait for both operations to complete
    await Promise.all([chatCreationPromise, aiResponsePromise]);
  };

  const inputDisabledMessage = useMemo(() => {
    if (messages.length === 0) return '';
    const lastMessage = messages[messages.length - 1];
    let message = lastMessage.toolInvocations
      ?.map((toolInvocation) => {
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

  // Users can always start new chats, regardless of loading state
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
