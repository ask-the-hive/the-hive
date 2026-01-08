import { getLastClientAction } from '@/ai/routing/client-action';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const run = () => {
  const messages: any[] = [
    {
      role: 'user',
      content: 'I want to lend USDC',
      annotations: [{ clientAction: { type: 'execute_lend', chain: 'solana' } }],
    },
    { role: 'assistant', content: 'ok' },
    { role: 'user', content: 'what tokens do i have', annotations: [] },
  ];

  const action = getLastClientAction(messages as any);
  assert(action === null, 'expected no clientAction when the latest user message has none');

  const messages2: any[] = [
    { role: 'assistant', content: '...' },
    {
      role: 'user',
      content: 'Execute lend',
      annotations: [{ clientAction: { type: 'execute_lend', chain: 'solana' } }],
    },
  ];
  const action2 = getLastClientAction(messages2 as any);
  assert(action2?.type === 'execute_lend', 'expected execute_lend clientAction on latest user message');

  // eslint-disable-next-line no-console
  console.log('validate-client-action passed');
};

run();

