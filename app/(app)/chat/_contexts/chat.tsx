'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { Message } from 'ai/react';
import { useChat as useAiChat } from '@ai-sdk/react';
import { Models } from '@/types/models';
import { usePrivy } from '@privy-io/react-auth';
import { generateId } from 'ai';
import { ChainType } from '@/app/_contexts/chain-context';
import { useChain } from '@/app/_contexts/chain-context';
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
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
} from '@/ai/action-names';
import * as Sentry from '@sentry/nextjs';
import { useLogin } from '@/hooks';

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
  sendInternalMessage: (message: string) => void;
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
  sendInternalMessage: () => {},
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
  const { user: privyUser } = usePrivy();
  const { walletAddresses, setCurrentChain } = useChain();
  const { user: loginUser, ready: privyReady, login, connectWallet } = useLogin();
  const { updateChatThreadState, removeChatThread } = useGlobalChatManager();
  const router = useRouter();
  const pathname = usePathname();
  const [completedLendToolCallIds, setCompletedLendToolCallIds] = useState<string[]>([]);

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
  const setChat = async (chatId: string) => {
    setChatId(chatId);
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
      userId: privyUser?.id,
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

  const maybePromptSolanaWallet = useCallback(
    (message: string) => {
      if (!privyReady) return;

      const lower = message.toLowerCase();
      const stakeKeywords =
        /\b(stake|staking|unstake)\b/.test(lower) ||
        /\b(drift|dsol|jupiter|jupsol|hsol|helius|jito|jitosol|marinade|msol|lido|stsol|sanctum|inf|blaze|blazestake|bsol|binance|bnsol|bybit|bbsol)\b/.test(
          lower,
        );

      if (!stakeKeywords) return;

      const recentHasStakingYields = messages
        .slice(-8)
        .some((m) =>
          getMessageToolInvocations(m).some((inv) =>
            String(inv?.toolName || '').includes(SOLANA_LIQUID_STAKING_YIELDS_ACTION),
          ),
        );

      const isProviderSelectionAfterYields = recentHasStakingYields && stakeKeywords;

      const isStakingIntent =
        /\b(stake|staking|unstake)\b/.test(lower) || isProviderSelectionAfterYields;
      if (!isStakingIntent) return;

      // Prefer Solana wallet connect flow for staking-related intents
      setCurrentChain('solana');

      const windowSolana = typeof window !== 'undefined' ? (window as any).solana : undefined;
      const browserSolanaConnected = !windowSolana || windowSolana.isConnected === true;
      const needsWallet = !walletAddresses.solana || !browserSolanaConnected;

      if (!needsWallet) return;

      if (loginUser) {
        connectWallet();
      } else {
        login?.();
      }
    },
    [
      connectWallet,
      login,
      loginUser,
      messages,
      privyReady,
      setCurrentChain,
      walletAddresses.solana,
    ],
  );

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

  // history disabled: no chat persistence effects

  const onSubmit = async () => {
    if (!input.trim()) return;

    const userInput = input;
    maybePromptSolanaWallet(userInput);
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

    await appendPromise;
  };

  const sendMessageBase = async (message: string, annotations?: any[]) => {
    maybePromptSolanaWallet(message);
    setIsResponseLoading(true);

    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });

    await append({
      role: 'user',
      content: message,
      ...(annotations ? { annotations } : {}),
    });
  };

  const sendMessage = async (message: string) => {
    await sendMessageBase(message);
  };

  const sendInternalMessage = async (message: string) => {
    await sendMessageBase(message, [{ internal: true }]);
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
        sendInternalMessage,
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
