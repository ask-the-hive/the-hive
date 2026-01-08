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
  SOLANA_STAKE_ACTION,
  SOLANA_WITHDRAW_ACTION,
} from '@/ai/action-names';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import type { Message as MessageType, ToolInvocation as ToolInvocationType } from 'ai';

const looksLikeApyTvlSummary = (text: string) => {
  const normalized = String(text || '').trim();
  if (!normalized) return false;
  const hasPercent = /\b\d+(?:\.\d+)?%/.test(normalized);
  const hasDollar = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/.test(normalized);
  return hasPercent && hasDollar;
};

const isInternalUserMessage = (message: any): boolean => {
  if (!message || message.role !== 'user') return false;
  const annotations = (message as any)?.annotations;
  if (!Array.isArray(annotations)) return false;
  return annotations.some((a) => a && typeof a === 'object' && (a as any).internal === true);
};

const readYieldSummaryFromToolInvocations = (toolInvocations: ToolInvocationType[]) => {
  const yieldsInvocation = toolInvocations.find((tool: any) => {
    if (tool.state !== 'result') return false;
    const name = String(tool.toolName || '').toLowerCase();
    return (
      name.includes(SOLANA_LENDING_YIELDS_ACTION) ||
      name.includes(SOLANA_LIQUID_STAKING_YIELDS_ACTION) ||
      name.includes('lending_yields') ||
      name.includes('liquid_staking_yields')
    );
  }) as any;
  if (!yieldsInvocation?.result) return null;

  const toolName = String(yieldsInvocation.toolName || '').toLowerCase();
  const kind: 'lending' | 'staking' = toolName.includes(SOLANA_LENDING_YIELDS_ACTION)
    ? 'lending'
    : 'staking';

  const pools = Array.isArray(yieldsInvocation.result?.body) ? yieldsInvocation.result.body : [];
  if (!pools.length) return null;

  const sortBy = String((yieldsInvocation as any)?.args?.sortBy || 'apy').toLowerCase();
  const best = pools
    .slice()
    .sort((a: any, b: any) => {
      if (sortBy === 'tvl') return (Number(b?.tvlUsd ?? 0) || 0) - (Number(a?.tvlUsd ?? 0) || 0);
      return (Number(b?.yield ?? 0) || 0) - (Number(a?.yield ?? 0) || 0);
    })[0];
  const symbol = String(best?.tokenData?.symbol || best?.symbol || '').toUpperCase();
  const apy = Number(best?.yield ?? 0);
  const tvlUsd = Number(best?.tvlUsd ?? 0);
  if (!symbol || !Number.isFinite(apy) || !Number.isFinite(tvlUsd)) return null;

  const apyText = apy.toFixed(2);
  const tvlText = Math.round(tvlUsd).toLocaleString('en-US');
  const cta =
    kind === 'lending'
      ? 'Click “Lend now” on the pool you want.'
      : 'Click “Stake now” on the pool you want.';
  if (sortBy === 'tvl') {
    return `The ${symbol} pool has the highest total value locked (TVL) right now at $${tvlText}, with an APY of ${apyText}%.\n\n${cta}`;
  }
  return `${symbol} has the highest APY right now at ${apyText}%, with a total value locked (TVL) of $${tvlText}.\n\n${cta}`;
};

const yieldsToolStateIn = (m?: MessageType): 'none' | 'pending' | 'complete' => {
  if (!m) return 'none';
  const invocations = getMessageToolInvocations(m);

  const isYieldsTool = (toolName: string) => {
    const normalized = String(toolName || '')
      .toLowerCase()
      .split('-')
      .join('_');
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
  const { isLoading, completedLendToolCallIds, completedStakeToolCallIds, messages } = useChat();
  const isUser = message.role === 'user';
  const currentToolInvocations = getMessageToolInvocations(message);
  const previousToolInvocations = getMessageToolInvocations(previousMessage);
  const nextMessageSameRole = nextMessage?.role === message.role;
  const previousMessageSameRole = previousMessage?.role === message.role;
  const showLoadingAvatar = !isUser && isLatestAssistant && isLoading;

  const suppressExtraYieldSummaries = React.useMemo(() => {
    if (message.role !== 'assistant') return false;
    if (currentToolInvocations.length > 0) return false;

    const list = messages || [];
    const idx = list.findIndex((m) => m === message || m.id === message.id);
    if (idx <= 0) return false;

    let yieldsIdx = -1;
    for (let i = idx - 1; i >= 0; i -= 1) {
      const prev = list[i];
      // Don't let internal/system user messages (e.g. sidebar shortcuts) break the "suppress
      // follow-up yield summaries" detection.
      if (prev.role === 'user' && !isInternalUserMessage(prev)) break;
      if (prev.role === 'assistant' && yieldsToolStateIn(prev) === 'complete') {
        yieldsIdx = i;
        break;
      }
    }
    if (yieldsIdx < 0) return false;

    // Always suppress assistant follow-ups after a yields tool; the UI shows a deterministic summary under the cards.
    return true;
  }, [currentToolInvocations.length, message, message.id, message.role, messages]);

  const displayContent = suppressExtraYieldSummaries
    ? null
    : getDisplayContent(
        message,
        previousMessage,
        completedLendToolCallIds,
        completedStakeToolCallIds,
      );
  const yieldsToolMessageFallback = React.useMemo(() => {
    if (message.role !== 'assistant') return null;
    if (yieldsToolStateIn(message) !== 'complete') return null;
    if (currentToolInvocations.length === 0) return null;

    const fromTool = readYieldSummaryFromToolInvocations(currentToolInvocations);
    if (fromTool) return fromTool;

    return null;
  }, [currentToolInvocations, message]);

  const finalDisplayContent = displayContent ?? yieldsToolMessageFallback;
  // Intentionally no skeleton loading here; users prefer stable output without placeholder flicker.
  const hasCancelledOrFailedActionTool = React.useMemo(() => {
    if (!currentToolInvocations.length) return false;
    const isRelevant = (toolName: string) => {
      const name = String(toolName || '');
      return (
        name.includes(SOLANA_LEND_ACTION) ||
        name.includes(SOLANA_STAKE_ACTION) ||
        name.includes(SOLANA_WITHDRAW_ACTION)
      );
    };

    return currentToolInvocations.some((tool: any) => {
      if (!isRelevant(tool.toolName)) return false;
      if (tool.state !== 'result') return false;
      const status = tool?.result?.body?.status;
      return status === 'cancelled' || status === 'failed';
    });
  }, [currentToolInvocations]);

  const shouldRenderTextAboveTools = React.useMemo(() => {
    if (currentToolInvocations.length === 0) return false;
    if (yieldsToolStateIn(message) !== 'none') return false;
    if (hasCancelledOrFailedActionTool) return false;

    // Default to tool-first layout. Only show a short lead-in above tools.
    const text = typeof finalDisplayContent === 'string' ? finalDisplayContent.trim() : '';
    if (!text) return false;
    if (text.length > 160) return false;
    return /^here (are|is)\b/i.test(text) || /^i (found|pulled)\b/i.test(text);
  }, [currentToolInvocations.length, finalDisplayContent, hasCancelledOrFailedActionTool, message]);

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
        {/* Show assistant text above tools when both exist (better UX for "Here are the best..." lead-in). */}
        {finalDisplayContent && !isUser && shouldRenderTextAboveTools && (
          <div className="pb-3">
            <MessageMarkdown content={finalDisplayContent as string} compressed={compressed} />
          </div>
        )}

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

        {finalDisplayContent && (!currentToolInvocations.length || isUser) && (
          <MessageMarkdown content={finalDisplayContent as string} compressed={compressed} />
        )}

        {/* For yields tools, render the computed summary below the cards/tool UI. */}
        {finalDisplayContent &&
          !isUser &&
          currentToolInvocations.length > 0 &&
          !shouldRenderTextAboveTools && (
            <MessageMarkdown content={finalDisplayContent as string} compressed={compressed} />
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
  completedStakeToolCallIds?: string[],
): string | null {
  if (message.role !== 'assistant') return message.content || null;

  const toolInvocations = getMessageToolInvocations(message);
  const previousToolInvocations = getMessageToolInvocations(previousMessage);
  const contentText =
    typeof message.content === 'string' ? message.content : String(message.content ?? '');
  const hasDecisionResponse = toolInvocations.some((tool) =>
    String(tool.toolName || '')
      .toLowerCase()
      .endsWith(`-${UI_DECISION_RESPONSE_NAME}`),
  );

  const hasUnstakeGuide = toolInvocations.some(
    (tool) =>
      tool.state === 'result' &&
      tool.toolName?.toLowerCase?.().includes('unstake') &&
      (tool as any).result?.body?.status === 'guide',
  );

  if (hasUnstakeGuide) return null;
  if (hasDecisionResponse) return null;

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

  const stripYieldBoilerplate = (raw: string): string => {
    const lines = String(raw || '').split('\n');
    const stripHeadingLine = (value: string) =>
      value
        .trim()
        .replace(/^>\s*/, '') // blockquote
        .replace(/^[-*+]\s+/, '') // bullet list
        .replace(/^\d+\.\s+/, '') // numbered list
        .replace(/^#+\s*/, '')
        .replace(/^(\*\*|__)(.*)\1$/, '$2')
        .replace(/:$/, '')
        .trim();

    const filtered = lines.filter((line, idx) => {
      const trimmed = stripHeadingLine(line);
      if (!trimmed) return idx !== 0; // drop leading empty lines only

      // Remove headings like "Lend USDS" / "Stake MSOL".
      if (/^(lend|stake)\s+[a-z0-9]{2,10}$/i.test(trimmed)) return false;

      // Remove generic boilerplate like "USDS offers the highest yield..." (it causes duplication).
      // Keep lines that include exact APY+TVL details.
      const isBoilerplate = /offers the highest (?:yield|apy)\b/i.test(trimmed);
      if (isBoilerplate) {
        const hasPercent = /\b\d+(?:\.\d+)?%/.test(trimmed);
        const hasDollar = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/.test(trimmed);
        if (!(hasPercent && hasDollar)) return false;
      }

      return true;
    });

    return filtered.join('\n').trim();
  };

  // If the previous message was a yields tool result, only allow a single follow-up summary that
  // includes exact APY + TVL; suppress any generic extra text (e.g. "Lend USDS ... offers ...").
  const prevYieldsComplete = yieldsToolStateIn(previousMessage) === 'complete';
  if (prevYieldsComplete) {
    const stripped = stripYieldBoilerplate(contentText);
    if (looksLikeApyTvlSummary(stripped)) return stripped || null;
    return null;
  }

  if (toolInvocations.length === 0 && previousMessage) {
    const prevTools = getMessageToolInvocations(previousMessage);
    const prevCancelled = prevTools.some((tool: any) => {
      if (tool.state !== 'result') return false;
      const status = (tool as any).result?.body?.status;
      return status === 'cancelled';
    });
    if (prevCancelled) return null;
  }

  const completedLendIds = completedLendToolCallIds ?? [];
  const completedStakeIds = completedStakeToolCallIds ?? [];

  const hasCompletedLend = toolInvocations.some((tool) => {
    if (!tool.toolName.includes(SOLANA_LEND_ACTION)) return false;
    if (tool.state !== 'result') return false;
    if (!completedLendIds.includes(tool.toolCallId)) return false;
    return true;
  });

  if (hasCompletedLend) {
    return "You're all set — your deposit is complete and is earning yield automatically. You can view or manage it using the card above.";
  }

  const hasCompletedStake = toolInvocations.some((tool) => {
    if (!tool.toolName.includes(SOLANA_STAKE_ACTION)) return false;
    if (tool.state !== 'result') return false;
    if (!completedStakeIds.includes(tool.toolCallId)) return false;
    return true;
  });

  if (hasCompletedStake) {
    return "You're all set — your staking deposit is complete and is earning yield automatically. You can view or manage it using the card above.";
  }

  const yieldsState = yieldsToolStateIn(message);
  if (yieldsState === 'pending') return null;
  if (yieldsState === 'complete') {
    // Hide text on the tool-result message; the model will provide the summary in a follow-up message.
    return null;
  }

  if (toolInvocations.length === 0) {
    return stripYieldBoilerplate(contentText) || null;
  }

  return message.content || null;
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
