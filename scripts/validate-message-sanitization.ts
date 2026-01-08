import { sanitizeMessagesForStreamText } from '@/lib/sanitize-messages';

type AnyMessage = any;

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const run = () => {
  const messages: AnyMessage[] = [
    { role: 'user', content: 'hi' },
    {
      role: 'assistant',
      content: '',
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: {
            state: 'call',
            step: 1,
            toolCallId: 'call_1',
            toolName: 'lending-solana_balance',
            args: { walletAddress: 'X', tokenAddress: 'So111...', tokenSymbol: 'SOL' },
          },
        },
      ],
    },
    {
      role: 'assistant',
      content: 'Some text',
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: {
            state: 'result',
            toolCallId: 'call_2',
            toolName: 'lending-solana_lending_yields',
            args: {},
            result: { ok: true },
          },
        },
      ],
    },
  ];

  const sanitized = sanitizeMessagesForStreamText(messages as any);

  assert(sanitized.length === 2, `expected 2 messages after sanitization, got ${sanitized.length}`);
  assert(
    sanitized.some((m) => m.content === 'Some text'),
    'expected the non-empty assistant message to remain',
  );

  const hasIncomplete = sanitized.some((m: any) =>
    (m.parts ?? []).some(
      (p: any) => p?.type === 'tool-invocation' && p?.toolInvocation?.state === 'call',
    ),
  );
  assert(!hasIncomplete, 'expected incomplete tool invocations to be removed');

  // eslint-disable-next-line no-console
  console.log('validate-message-sanitization passed');
};

run();

