import { SOLANA_LEND_ACTION } from '@/ai/action-names';
import { buildSolanaRouterContext } from '@/ai/routing/solana-router';

const fail = (message: string) => {
  throw new Error(message);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
};

const run = () => {
  const toolName = `lending-${SOLANA_LEND_ACTION}`;
  const messages = [
    {
      role: 'assistant',
      content: '',
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName,
            state: 'result',
            args: { tokenSymbol: 'USDC', tokenAddress: 'mint1', protocol: 'kamino' },
            result: { body: { status: 'failed' } },
          },
        },
      ],
    },
    {
      role: 'user',
      content: '',
      annotations: [
        {
          internal: true,
          resumeAction: {
            toolName,
            args: { tokenSymbol: 'USDT', tokenAddress: 'mint2', protocol: 'jupiter' },
            status: 'cancelled',
          },
        },
      ],
    },
  ];

  const context = buildSolanaRouterContext(messages as any);
  assert(Boolean(context.lastAction), 'Expected lastAction to be defined');
  assert(
    context.lastAction?.tool === toolName,
    `Expected toolName=${toolName}, got ${String(context.lastAction?.tool)}`,
  );
  assert(
    context.lastAction?.args?.tokenSymbol === 'USDT',
    `Expected resumeAction tokenSymbol=USDT, got ${String(context.lastAction?.args?.tokenSymbol)}`,
  );
  assert(
    context.lastAction?.status === 'cancelled',
    `Expected resumeAction status=cancelled, got ${String(context.lastAction?.status)}`,
  );

  // eslint-disable-next-line no-console
  console.log('validate-router-context passed (resumeAction precedence)');
};

run();
