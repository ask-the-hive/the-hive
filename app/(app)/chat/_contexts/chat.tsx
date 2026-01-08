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
import { ChainType, useChain } from '@/app/_contexts/chain-context';
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
  SOLANA_WITHDRAW_ACTION,
} from '@/ai/action-names';
import { isStablecoinSymbol, isSupportedSolanaStakingLst } from '@/lib/yield-support';
import { resolveLendingProjectKey } from '@/lib/lending';
import * as Sentry from '@sentry/nextjs';

export enum ColorMode {
  LIGHT = 'light',
  DARK = 'dark',
}

type ToolResult<T> = {
  message: string;
  body?: T;
};

const SOLANA_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const tokenizeToUpper = (text: string): string[] => {
  const normalized = String(text ?? '');
  const tokens: string[] = [];
  let current = '';

  const isWordChar = (char: string) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122) || // a-z
      char === '_' // underscore
    );
  };

  for (let idx = 0; idx < normalized.length; idx += 1) {
    const char = normalized[idx];
    if (isWordChar(char)) {
      current += char;
      continue;
    }
    if (current) {
      tokens.push(current.toUpperCase());
      current = '';
    }
  }

  if (current) tokens.push(current.toUpperCase());
  return tokens;
};

const getClientActionFromMessage = (text: string): Record<string, unknown> | null => {
  const tokens = tokenizeToUpper(text);
  const stablecoin = tokens.find((t) => isStablecoinSymbol(t));
  const lstSymbol = tokens.find((t) => isSupportedSolanaStakingLst(t));
  const hasDeposit =
    tokens.includes('DEPOSIT') || tokens.includes('LEND') || tokens.includes('LENDING');
  const hasWithdraw = tokens.includes('WITHDRAW') || tokens.includes('WITHDRAWAL') || tokens.includes('REDEEM');
  const hasStake = tokens.includes('STAKE') || tokens.includes('STAKING');

  if (hasWithdraw) {
    const protocolKey = resolveLendingProjectKey(text);
    const addressMatch = text.match(SOLANA_ADDRESS_PATTERN)?.[0];
    if (protocolKey) {
      return {
        type: 'execute_withdraw',
        chain: 'solana',
        ...(addressMatch ? { tokenAddress: addressMatch } : {}),
        protocol: protocolKey,
      };
    }
    return {
      type: 'execute_withdraw',
      chain: 'solana',
      ...(addressMatch ? { tokenAddress: addressMatch } : {}),
    };
  }

  if (hasDeposit && stablecoin) {
    const protocolKey = resolveLendingProjectKey(text);
    const addressMatch = text.match(SOLANA_ADDRESS_PATTERN)?.[0];
    if (protocolKey && addressMatch) {
      return {
        type: 'execute_lend',
        chain: 'solana',
        tokenSymbol: stablecoin,
        tokenAddress: addressMatch,
        protocol: protocolKey,
      };
    }
  }

  if (hasStake && lstSymbol) {
    return {
      type: 'execute_stake',
      chain: 'solana',
      lstSymbol,
    };
  }

  return null;
};

interface ChatContextType {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  sendMessage: (message: string, options?: { skipWalletPrompt?: boolean }) => void;
  sendInternalMessage: (message: string) => void;
  sendClientAction: (
    message: string,
    clientAction: Record<string, unknown>,
    options?: { skipWalletPrompt?: boolean; visible?: boolean },
  ) => void;
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
  completedStakeToolCallIds: string[];
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  input: '',
  setInput: () => {},
  onSubmit: async () => {},
  isLoading: false,
  sendMessage: () => {},
  sendInternalMessage: () => {},
  sendClientAction: () => {},
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
  completedStakeToolCallIds: [],
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

const findToolInvocationById = (messages: Message[], toolCallId: string) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const invocations = getMessageToolInvocations(messages[i]);
    const match = invocations.find((invocation) => invocation.toolCallId === toolCallId);
    if (match) return match;
  }
  return null;
};

const isResumeEligibleTool = (toolName?: string) => {
  if (!toolName) return false;
  return (
    toolName.includes(SOLANA_LEND_ACTION) ||
    toolName.includes(SOLANA_WITHDRAW_ACTION) ||
    toolName.includes(SOLANA_STAKE_ACTION) ||
    toolName.includes(SOLANA_UNSTAKE_ACTION) ||
    toolName.includes(SOLANA_TRADE_ACTION) ||
    toolName.includes(SOLANA_TRANSFER_NAME)
  );
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user: privyUser } = usePrivy();
  const { walletAddresses } = useChain();
  const { updateChatThreadState, removeChatThread } = useGlobalChatManager();
  const router = useRouter();
  const pathname = usePathname();
  const [completedLendToolCallIds, setCompletedLendToolCallIds] = useState<string[]>([]);
  const [completedStakeToolCallIds, setCompletedStakeToolCallIds] = useState<string[]>([]);
  const resumeActionToolCallIdsRef = useRef<Set<string>>(new Set());

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
      walletAddress: walletAddresses[chain],
    },
    onError: (error) => {
      setIsResponseLoading(false);
      updateChatThreadState(chatId, {
        isLoading: false,
        isResponseLoading: false,
      });
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

    const stakeInvocation = toolInvocations.find((toolInvocation) =>
      toolInvocation.toolName.includes(SOLANA_STAKE_ACTION),
    );

    if (stakeInvocation && (result as any)?.body?.status === 'complete') {
      setCompletedStakeToolCallIds((prev) =>
        prev.includes(toolCallId) ? prev : [...prev, toolCallId],
      );
    }

    const status = (result as any)?.body?.status;
    if (
      (status === 'cancelled' || status === 'failed') &&
      !resumeActionToolCallIdsRef.current.has(toolCallId)
    ) {
      const invocation = findToolInvocationById(messages, toolCallId);
      if (invocation && isResumeEligibleTool(invocation.toolName)) {
        resumeActionToolCallIdsRef.current.add(toolCallId);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'user',
            content: '',
            annotations: [
              {
                internal: true,
                resumeAction: {
                  toolName: invocation.toolName,
                  args: invocation.args ?? {},
                  status,
                },
              },
            ],
          } as any,
        ]);
      }
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

  const onSubmit = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput('');

    const clientAction = getClientActionFromMessage(userInput);
    if (clientAction && (clientAction as any)?.type === 'execute_withdraw' && (clientAction as any)?.chain === 'solana') {
      await sendClientAction(userInput, clientAction, { visible: true });
      return;
    }

    await sendMessageBase(userInput, { ...(clientAction ? { annotations: [{ clientAction }] } : {}) });
  };

  async function sendMessageBase(
    message: string,
    options?: { skipWalletPrompt?: boolean; annotations?: any[] },
  ) {
    setIsResponseLoading(true);

    updateChatThreadState(chatId, {
      isLoading: true,
      isResponseLoading: true,
    });

    await append({
      role: 'user',
      content: message,
      ...(options?.annotations ? { annotations: options.annotations } : {}),
    });
  }

  const sendMessage = async (message: string, options?: { skipWalletPrompt?: boolean }) => {
    await sendMessageBase(message, options);
  };

  const sendInternalMessage = async (message: string) => {
    await sendMessageBase(message, { annotations: [{ internal: true }] });
  };

  const sendClientAction = async (
    message: string,
    clientAction: Record<string, unknown>,
    options?: { skipWalletPrompt?: boolean; visible?: boolean },
  ) => {
    // For card-click stake executions, bypass the model and render the tool UI immediately.
    if (
      options?.visible === true &&
      (clientAction as any)?.type === 'execute_stake' &&
      (clientAction as any)?.chain === 'solana'
    ) {
      const annotations = [
        {
          internal: false,
          clientAction,
        },
      ];

      const toolCallId = generateId();
      const contractAddress = String((clientAction as any)?.contractAddress ?? '');
      const poolData = (clientAction as any)?.poolData;

      setIsResponseLoading(false);
      updateChatThreadState(chatId, { isLoading: false, isResponseLoading: false });

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'user',
          content: message,
          annotations,
        } as any,
        {
          id: generateId(),
          role: 'assistant',
          content: '',
          parts: [
            {
              type: 'tool-invocation',
              toolInvocation: {
                toolCallId,
                toolName: `staking-${SOLANA_STAKE_ACTION}`,
                state: 'call',
                args: {
                  contractAddress,
                  ...(poolData ? { poolData } : {}),
                },
              },
            },
          ],
        } as any,
      ]);

      return;
    }

    // For card-click executions, bypass the model and render the tool UI immediately.
    // This avoids cases where the LLM returns an empty assistant message and the UI appears stuck.
    if (
      options?.visible === true &&
      (clientAction as any)?.type === 'execute_lend' &&
      (clientAction as any)?.chain === 'solana'
    ) {
      const annotations = [
        {
          internal: false,
          clientAction,
        },
      ];

      const toolCallId = generateId();
      const tokenAddress = String((clientAction as any)?.tokenAddress ?? '');
      const tokenSymbol = String((clientAction as any)?.tokenSymbol ?? '');
      const protocol = String((clientAction as any)?.protocol ?? '');

      setIsResponseLoading(false);
      updateChatThreadState(chatId, { isLoading: false, isResponseLoading: false });

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'user',
          content: message,
          annotations,
        } as any,
        {
          id: generateId(),
          role: 'assistant',
          content: '',
          parts: [
            {
              type: 'tool-invocation',
              toolInvocation: {
                toolCallId,
                toolName: `lending-${SOLANA_LEND_ACTION}`,
                state: 'call',
                args: {
                  tokenAddress,
                  tokenSymbol,
                  protocol,
                  walletAddress: walletAddresses.solana || undefined,
                },
              },
            },
          ],
        } as any,
      ]);

      return;
    }

    // For typed withdraw executions with a connected wallet, bypass the model and open withdraw UI directly.
    if (
      options?.visible === true &&
      (clientAction as any)?.type === 'execute_withdraw' &&
      (clientAction as any)?.chain === 'solana' &&
      walletAddresses.solana
    ) {
      const annotations = [
        {
          internal: false,
          clientAction,
        },
      ];

      const toolCallId = generateId();
      const tokenAddress = String((clientAction as any)?.tokenAddress ?? '');
      const protocol = String((clientAction as any)?.protocol ?? '');

      setIsResponseLoading(false);
      updateChatThreadState(chatId, { isLoading: false, isResponseLoading: false });

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'user',
          content: message,
          annotations,
        } as any,
        {
          id: generateId(),
          role: 'assistant',
          content: '',
          parts: [
            {
              type: 'tool-invocation',
              toolInvocation: {
                toolCallId,
                toolName: `lending-${SOLANA_WITHDRAW_ACTION}`,
                state: 'call',
                args: {
                  walletAddress: walletAddresses.solana,
                  ...(protocol ? { protocolAddress: protocol } : {}),
                  ...(tokenAddress ? { tokenAddress } : {}),
                },
              },
            },
          ],
        } as any,
      ]);

      return;
    }

    await sendMessageBase(message, {
      ...(typeof options?.skipWalletPrompt === 'boolean' && options?.skipWalletPrompt
        ? { skipWalletPrompt: options.skipWalletPrompt }
        : {}),
      annotations: [
        {
          internal: options?.visible ? false : true,
          clientAction,
        },
      ],
    });
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
          case SOLANA_WITHDRAW_ACTION:
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
        sendClientAction,
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
        completedStakeToolCallIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
