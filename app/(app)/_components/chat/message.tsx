'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { Markdown, Icon, Logo, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import Link from './link';
import { cn } from '@/lib/utils';
import { getAgentName } from '../../chat/_components/tools/tool-to-agent';
import { pfpURL } from '@/lib/pfp';
import { useChat } from '@/app/(app)/chat/_contexts/chat';
import {
  SOLANA_LEND_ACTION,
  SOLANA_ALL_BALANCES_NAME,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
} from '@/ai/action-names';
import type { Message as MessageType, ToolInvocation as ToolInvocationType } from 'ai';

interface Props {
  message: MessageType;
  ToolComponent: React.ComponentType<{
    tool: ToolInvocationType;
    prevToolAgent?: string;
  }>;
  className?: string;
  previousMessage?: MessageType;
  nextMessage?: MessageType;
  compressed?: boolean;
  isLatestAssistant?: boolean;
}

const Message: React.FC<Props> = ({
  message,
  ToolComponent,
  className,
  previousMessage,
  nextMessage,
  compressed,
  isLatestAssistant,
}) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = '/hive-thinking.gif';
    }
  }, []);

  const { user } = usePrivy();
  const { isResponseLoading, completedLendToolCallIds } = useChat();

  const isUser = message.role === 'user';

  const currentToolInvocations = getMessageToolInvocations(message);
  const previousToolInvocations = getMessageToolInvocations(previousMessage);

  const nextMessageSameRole = nextMessage?.role === message.role;
  const previousMessageSameRole = previousMessage?.role === message.role;
  const showLoadingAvatar = !isUser && isLatestAssistant && isResponseLoading;

  return (
    <div
      className={cn(
        'flex w-full px-2 py-4 max-w-full last:border-b-0 h-fit',
        'flex-col gap-2',
        'md:flex-row md:gap-4 md:px-4',
        compressed && 'md:px-2 md:flex-col gap-0 md:gap-1',
        nextMessageSameRole && 'pb-0',
        previousMessageSameRole && 'pt-0',
        previousMessageSameRole &&
          compressed &&
          'border-b border-gray-200 dark:border-neutral-700 pt-2',
        !nextMessageSameRole && 'border-b border-gray-200 dark:border-neutral-700',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center md:items-start gap-2 md:gap-4',
          previousMessageSameRole && 'hidden md:block',
          compressed && 'md:gap-2 md:flex md:items-center',
          previousMessageSameRole && compressed && 'hidden md:hidden',
        )}
      >
        <div
          className={cn(
            'hidden md:flex items-center justify-center w-6 h-6 md:w-10 md:h-10 rounded-full',
            compressed && 'md:flex md:h-6 md:w-6',
            isUser &&
              'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
            previousMessageSameRole && 'opacity-0',
          )}
        >
          {isUser ? (
            <Avatar className={cn('w-10 h-10', compressed && 'w-6 h-6')}>
              <AvatarFallback>
                <Icon
                  name="User"
                  className={cn('w-4 h-4 md:w-6 md:h-6', compressed && 'md:w-4 md:h-4')}
                />
              </AvatarFallback>
              {user && <AvatarImage src={pfpURL(user, false)} />}
            </Avatar>
          ) : showLoadingAvatar ? (
            <Image
              src="/hive-thinking.gif"
              alt="The Hive is thinking"
              width={compressed ? 24 : 40}
              height={compressed ? 24 : 40}
              className={cn('h-10 w-10', compressed && 'h-6 w-6')}
              priority
              unoptimized
            />
          ) : (
            <Logo className={cn('h-10 w-10', compressed && 'h-6 w-6')} />
          )}
        </div>
        <p
          className={cn(
            'text-sm font-semibold md:hidden',
            compressed && 'hidden md:block',
            previousMessageSameRole && 'hidden md:hidden',
            isUser
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-brand-600 dark:text-brand-600',
          )}
        >
          {message.role === 'user' ? 'You' : 'The Hive'}
        </p>
      </div>
      <div
        className={cn(
          'pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2',
          compressed && 'gap-0 md:w-full pt-0',
        )}
      >
        {currentToolInvocations.length > 0 && (
          <div className="flex flex-col gap-2">
            {currentToolInvocations.map((tool, index) => (
              <ToolComponent
                key={tool.toolCallId}
                tool={tool}
                prevToolAgent={
                  index === 0
                    ? previousToolInvocations[0]
                      ? getAgentName(previousToolInvocations[0])
                      : undefined
                    : currentToolInvocations[index - 1]
                      ? getAgentName(currentToolInvocations[index - 1])
                      : undefined
                }
              />
            ))}
          </div>
        )}
        {getDisplayContent(message, previousMessage, completedLendToolCallIds) && (
          <MessageMarkdown
            content={
              getDisplayContent(message, previousMessage, completedLendToolCallIds) as string
            }
            compressed={compressed}
          />
        )}
      </div>
    </div>
  );
};

function getMessageToolInvocations(message?: MessageType): ToolInvocationType[] {
  if (!message) return [];

  if (message.parts && message.parts.length > 0) {
    return (message.parts as any[])
      .filter((part) => part && part.type === 'tool-invocation' && (part as any).toolInvocation)
      .map((part) => (part as any).toolInvocation as ToolInvocationType);
  }

  const legacyToolInvocations = (message as any).toolInvocations as
    | ToolInvocationType[]
    | undefined;

  return legacyToolInvocations ?? [];
}

function getDisplayContent(
  message: MessageType,
  previousMessage?: MessageType,
  completedLendToolCallIds?: string[],
): string | null {
  if (message.role !== 'assistant') return message.content || null;

  const toolInvocations = getMessageToolInvocations(message);

  const hasUnstakeGuide = toolInvocations.some(
    (tool) =>
      tool.state === 'result' &&
      tool.toolName?.toLowerCase?.().includes('unstake') &&
      (tool as any).result?.body?.status === 'guide',
  );

  if (hasUnstakeGuide) return null;

  const isSolanaWalletAllBalances = (toolName: string) => {
    const parts = toolName.split('-');
    const toolAgent = parts[0];
    const actionName = parts.slice(1).join('-');

    return toolAgent === 'wallet' && actionName === SOLANA_ALL_BALANCES_NAME;
  };

  const hasAllBalancesResult = toolInvocations.some(
    (tool) => isSolanaWalletAllBalances(tool.toolName) && tool.state === 'result',
  );

  if (hasAllBalancesResult) {
    return 'Balances shown above. Pick a token to swap, lend, stake, or explore next.';
  }

  const completedIds = completedLendToolCallIds ?? [];

  const hasCompletedLend = toolInvocations.some((tool) => {
    if (!tool.toolName.includes(SOLANA_LEND_ACTION)) return false;
    if (tool.state !== 'result') return false;
    if (!completedIds.includes(tool.toolCallId)) return false;
    return true;
  });

  if (hasCompletedLend) {
    return "You're all set — your lending deposit is complete and now earning yield automatically. You can view or manage it using the card above.";
  }

  const YIELDS_CTA = 'Yields shown above. Pick a pool card to continue.';

  const yieldsToolStateIn = (m?: MessageType): 'none' | 'pending' | 'complete' => {
    if (!m) return 'none';
    const invocations = getMessageToolInvocations(m);

    const isYieldsTool = (toolName: string) => {
      const normalized = String(toolName || '').toLowerCase().replace(/-/g, '_');
      return (
        normalized.includes(SOLANA_LENDING_YIELDS_ACTION) ||
        normalized.includes(SOLANA_LIQUID_STAKING_YIELDS_ACTION) ||
        normalized.includes('lending_yields') ||
        normalized.includes('liquid_staking_yields')
      );
    };

    const yieldsInvocations = invocations.filter((tool) => isYieldsTool(tool.toolName));
    if (!yieldsInvocations.length) return 'none';

    const hasNonResult = yieldsInvocations.some((tool) => tool.state !== 'result');
    return hasNonResult ? 'pending' : 'complete';
  };

  const yieldsState = yieldsToolStateIn(message);
  const prevYieldsState = yieldsToolStateIn(previousMessage);

  if (yieldsState === 'pending') return null;

  if (yieldsState === 'complete') {
    return YIELDS_CTA;
  }

  if (prevYieldsState === 'complete') {
    const sanitized = stripYieldListings(message.content || '', { appendCta: false });
    if (!sanitized) return null;

    if (sanitized.trim() === YIELDS_CTA) return null;

    const normalized = sanitized.replace(/\s+/g, ' ').trim();
    const isJustPickInstruction =
      normalized.length <= 140 &&
      /\b(pick|choose|select)\b/i.test(normalized) &&
      /\b(pool|pools|card|cards)\b/i.test(normalized);
    if (isJustPickInstruction) return null;

    return sanitized;
  }

  return message.content || null;
}

function stripYieldListings(
  content: string,
  options: { appendCta?: boolean } = {},
): string {
  const appendCta = options.appendCta !== false;
  const raw = (content || '').trim();
  if (!raw) return '';

  const lines = raw.split('\n');
  const output: string[] = [];

  let skippingList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^([-*•]|\d+[.)])\s+/.test(trimmed);
    const hasPercent = /\b\d+(?:\.\d+)?%\b/.test(trimmed);
    const hasYieldWord = /\b(apy|apr|yield|tvl)\b/i.test(trimmed);
    const hasVia = /\bvia\b/i.test(trimmed);
    const looksLikePoolListing =
      hasPercent &&
      (hasYieldWord || hasVia || isBullet) &&
      (hasVia ||
        isBullet ||
        /\b(jupiter|kamino|marginfi|solend|drift|lido|sanctum|jito|marinade|helius|binance|bybit)\b/i.test(
          trimmed,
        ) ||
        /^[A-Z0-9*]{2,16}\b/.test(trimmed));

    const looksLikeListIntro =
      /\bhere (are|is)\b/i.test(trimmed) &&
      /\b(options|pools|rates|yields)\b/i.test(trimmed) &&
      /\b(lend|lending|stake|staking)\b/i.test(trimmed);

    if (looksLikeListIntro) {
      continue;
    }

    if (looksLikePoolListing) {
      skippingList = true;
      continue;
    }

    if (skippingList) {
      if (trimmed === '') continue;
      const looksLikePoolListingContinuation =
        hasPercent &&
        (hasYieldWord || hasVia) &&
        (hasVia ||
          /\b(jupiter|kamino|marginfi|solend|drift|lido|sanctum|jito|marinade|helius|binance|bybit)\b/i.test(
            trimmed,
          ) ||
          /^[A-Z0-9*]{2,16}\b/.test(trimmed));
      if (isBullet || looksLikePoolListingContinuation) continue;
      skippingList = false;
    }

    output.push(line);
  }

  const cleaned = output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) return '';

  const hasPickInstruction = /\b(pick|choose|select)\b/i.test(cleaned);
  const hasCardReference = /\b(card|cards)\b/i.test(cleaned);
  if (appendCta && !hasPickInstruction && !hasCardReference) {
    return `${cleaned}\n\nPick a pool card above to continue.`;
  }

  return cleaned;
}

const MessageMarkdown = React.memo(
  ({ content, compressed }: { content: string; compressed?: boolean }) => {
    return (
      <Markdown
        components={{
          a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            if (!href) return children;
            return <Link url={href}>{children}</Link>;
          },
          ...(compressed
            ? {
                h1({ children }) {
                  return <h1 className={cn('text-lg md:text-xl font-bold')}>{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className={cn('text-md md:text-lg font-bold')}>{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className={cn('text-sm md:text-md font-bold')}>{children}</h3>;
                },
                h4({ children }) {
                  return <h4 className={cn('text-sm md:text-sm font-bold')}>{children}</h4>;
                },
                h5({ children }) {
                  return <h5 className={cn('text-xs md:text-xs font-bold')}>{children}</h5>;
                },
                h6({ children }) {
                  return <h6 className={cn('text-xs font-bold')}>{children}</h6>;
                },
                li({ children }) {
                  return <li className="text-xs md:text-sm">{children}</li>;
                },
                p({ children, node }) {
                  const hasBlockElements = node?.children?.some((child: any) => {
                    const tag = (child as any)?.tagName as string | undefined;
                    return (
                      (child as any)?.type === 'element' &&
                      typeof tag === 'string' &&
                      ['div', 'p', 'blockquote', 'form'].includes(tag)
                    );
                  });

                  if (hasBlockElements) {
                    return <div className="text-xs md:text-sm">{children}</div>;
                  }

                  return <p className="text-xs md:text-sm">{children}</p>;
                },
              }
            : {}),
        }}
      >
        {content}
      </Markdown>
    );
  },
);

MessageMarkdown.displayName = 'MessageMarkdown';

export default Message;
