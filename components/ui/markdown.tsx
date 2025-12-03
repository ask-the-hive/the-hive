import React, { useMemo } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import { cn } from '@/lib/utils';
import { CodeBlock } from './codeblock';

interface Props {
  children: string;
  asSpan?: boolean;
  components?: Components;
  headingClassName?: string;
}

export const Markdown: React.FC<Props> = ({
  children,
  asSpan = false,
  components,
  headingClassName,
}) => {
  const value = useMemo(() => {
    return children
      .replaceAll('\\(', '$')
      .replaceAll('\\)', '$')
      .replaceAll('\\[', '$$')
      .replaceAll('\\]', '$$');
  }, [children]);

  const memoizedContent = useMemo(
    () => (
      <ReactMarkdown
        className={
          asSpan
            ? undefined
            : 'prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 flex flex-col gap-4'
        }
        components={{
          h1({ children }) {
            return (
              <h1 className={cn('text-xl md:text-2xl font-bold', headingClassName)}>{children}</h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className={cn('text-lg md:text-xl font-bold', headingClassName)}>{children}</h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className={cn('text-md md:text-lg font-bold', headingClassName)}>{children}</h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className={cn('text-sm md:text-md font-bold', headingClassName)}>{children}</h4>
            );
          },
          h5({ children }) {
            return (
              <h5 className={cn('text-xs md:text-sm font-bold', headingClassName)}>{children}</h5>
            );
          },
          h6({ children }) {
            return <h6 className={cn('text-xs font-bold', headingClassName)}>{children}</h6>;
          },
          p({ children, node }) {
            const hasBlockElements = node?.children?.some((child: any) => {
              // child can be Text | Element | other ElementContent variants; guard for elements
              const tag = child?.tagName as string | undefined;
              return (
                child?.type === 'element' &&
                typeof tag === 'string' &&
                ['div', 'p', 'blockquote', 'form'].includes(tag)
              );
            });

            if (hasBlockElements) {
              return <div className="text-sm md:text-base">{children}</div>;
            }

            if (asSpan) {
              return <span>{children}</span>;
            }
            return <p className="text-sm md:text-base">{children}</p>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-brand-500 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');

            if (!match) {
              return <code className={className}>{children}</code>;
            }

            return (
              <CodeBlock
                language={match[1] || 'Plain Text'}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-4 text-sm md:text-base flex flex-col gap-2">
                {children}
              </ol>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc pl-4 text-sm md:text-base flex flex-col gap-2">
                {children}
              </ul>
            );
          },
          li({ children }) {
            return <li className="pl-0 ml-4 text-sm md:text-base space-y-2">{children}</li>;
          },
          img({ src, alt }) {
            if (!src) return null;
            return (
              <Image
                src={src}
                alt={alt || 'image'}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                unoptimized
              />
            );
          },
          ...components,
        }}
      >
        {value}
      </ReactMarkdown>
    ),
    [value, asSpan, components],
  );

  return memoizedContent;
};

Markdown.displayName = 'Markdown';
