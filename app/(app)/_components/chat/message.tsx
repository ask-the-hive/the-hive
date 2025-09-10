'use client';

import React from 'react';

import { usePrivy } from '@privy-io/react-auth';

import {
  Markdown,
  Icon,
  Logo,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';

import Link from './link';

import { cn } from '@/lib/utils';

import { getAgentName } from '../../chat/_components/tools/tool-to-agent';
import { pfpURL } from '@/lib/pfp';

import type {
  Message as MessageType,
  ToolInvocation as ToolInvocationType,
} from 'ai';

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
}

const Message: React.FC<Props> = ({
  message,
  ToolComponent,
  className,
  previousMessage,
  nextMessage,
  compressed,
}) => {
  const { user } = usePrivy();

  const isUser = message.role === 'user';

  const nextMessageSameRole = nextMessage?.role === message.role;
  const previousMessageSameRole = previousMessage?.role === message.role;

  return (
    <div
      className={cn(
        // base styles
        'flex w-full px-2 py-4 max-w-full last:border-b-0 h-fit',
        // mobile styles
        'flex-col gap-2',
        // desktop styles
        'md:flex-row md:gap-4 md:px-4',
        compressed && 'md:px-2 md:flex-col gap-0 md:gap-1',
        nextMessageSameRole && 'pb-0',
        previousMessageSameRole && 'pt-0',
        previousMessageSameRole &&
          compressed &&
          'border-b border-gray-200 dark:border-neutral-700 pt-2',
        !nextMessageSameRole &&
          'border-b border-gray-200 dark:border-neutral-700',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center md:items-start gap-2 md:gap-4',
          previousMessageSameRole && 'hidden md:block',
          compressed && 'md:gap-2 md:flex md:items-center',
          previousMessageSameRole && compressed && 'hidden md:hidden'
        )}
      >
        <div
          className={cn(
            'hidden md:flex items-center justify-center w-6 h-6 md:w-10 md:h-10 rounded-full',
            compressed && 'md:flex md:h-6 md:w-6',
            isUser &&
              'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
            previousMessageSameRole && 'opacity-0'
          )}
        >
          {isUser ? (
            <Avatar className={cn('w-10 h-10', compressed && 'w-6 h-6')}>
              <AvatarFallback>
                <Icon
                  name="User"
                  className={cn(
                    'w-4 h-4 md:w-6 md:h-6',
                    compressed && 'md:w-4 md:h-4'
                  )}
                />
              </AvatarFallback>
              {user && <AvatarImage src={pfpURL(user, false)} />}
            </Avatar>
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
              : 'text-brand-600 dark:text-brand-600'
          )}
        >
          {message.role === 'user' ? 'You' : 'The Hive'}
        </p>
      </div>
      <div
        className={cn(
          'pt-2 w-full max-w-full md:flex-1 md:w-0 overflow-hidden flex flex-col gap-2',
          compressed && 'gap-0 md:w-full pt-0'
        )}
      >
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="flex flex-col gap-2">
            {message.toolInvocations.map((tool, index) => (
              <ToolComponent
                key={tool.toolCallId}
                tool={tool}
                prevToolAgent={
                  index === 0
                    ? previousMessage?.toolInvocations?.[0]
                      ? getAgentName(previousMessage?.toolInvocations?.[0])
                      : undefined
                    : message.toolInvocations![index - 1]
                      ? getAgentName(message.toolInvocations![index - 1])
                      : undefined
                }
              />
            ))}
          </div>
        )}
        {message.content && (
          <MessageMarkdown content={message.content} compressed={compressed} />
        )}
      </div>
    </div>
  );
};

const MessageMarkdown = React.memo(
  ({ content, compressed }: { content: string; compressed?: boolean }) => {
    return (
      <Markdown
        components={{
          a: ({
            href,
            children,
          }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            if (!href) return children;
            return <Link url={href}>{children}</Link>;
          },
          ...(compressed
            ? {
                h1({ children }) {
                  return (
                    <h1 className={cn('text-lg md:text-xl font-bold')}>
                      {children}
                    </h1>
                  );
                },
                h2({ children }) {
                  return (
                    <h2 className={cn('text-md md:text-lg font-bold')}>
                      {children}
                    </h2>
                  );
                },
                h3({ children }) {
                  return (
                    <h3 className={cn('text-sm md:text-md font-bold')}>
                      {children}
                    </h3>
                  );
                },
                h4({ children }) {
                  return (
                    <h4 className={cn('text-sm md:text-sm font-bold')}>
                      {children}
                    </h4>
                  );
                },
                h5({ children }) {
                  return (
                    <h5 className={cn('text-xs md:text-xs font-bold')}>
                      {children}
                    </h5>
                  );
                },
                h6({ children }) {
                  return (
                    <h6 className={cn('text-xs font-bold')}>{children}</h6>
                  );
                },
                li({ children }) {
                  return <li className="text-xs md:text-sm">{children}</li>;
                },
                p({ children, node }) {
                  const hasBlockElements = node?.children?.some((child: any) => {
                    // child can be Text | Element | other ElementContent variants; guard for elements
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
  }
);

MessageMarkdown.displayName = 'MessageMarkdown';

export default Message;
