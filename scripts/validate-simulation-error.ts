import { toUserFacingSolanaSimulationError } from '@/lib/solana-simulation-error';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const cases: Array<{ name: string; logs: string[]; expectIncludes: string[] }> = [
  {
    name: 'insufficient funds',
    logs: ['Program log: insufficient funds for rent'],
    expectIncludes: ['Add a little SOL', 'Next:'],
  },
  {
    name: 'expired blockhash',
    logs: ['Blockhash not found'],
    expectIncludes: ['expired', 'Next:'],
  },
  {
    name: 'generic',
    logs: ['Program log: custom program error: 0x1'],
    expectIncludes: ['Next:'],
  },
];

for (const testCase of cases) {
  const text = toUserFacingSolanaSimulationError('Context message.', testCase.logs);
  assert(typeof text === 'string' && text.length > 0, `${testCase.name}: empty result`);
  assert(text.includes('Context message.'), `${testCase.name}: missing context message`);

  for (const expected of testCase.expectIncludes) {
    assert(text.includes(expected), `${testCase.name}: missing "${expected}"`);
  }

  const lower = text.toLowerCase();
  assert(!lower.includes('instructionerror'), `${testCase.name}: leaked raw error`);
  assert(!lower.includes('custom:'), `${testCase.name}: leaked raw error`);
}

console.log('validate-simulation-error: ok');

