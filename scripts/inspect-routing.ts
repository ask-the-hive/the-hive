import { CoreMessage, LanguageModelV1 } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { routingFixtures } from '@/scripts/routing-fixtures';
import { classifyIntent } from '@/ai/routing/classify-intent';
import { deriveFlowStateFromIntent } from '@/ai/routing/flow-state';
import { deriveFlowStateFromConversation } from '@/ai/routing/derive-flow-state';
import { routeIntent } from '@/ai/routing/route-intent';

type Provider = 'openai' | 'anthropic' | 'xai' | 'gemini' | 'deepseek';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1) return undefined;
    return args[idx + 1];
  };

  const has = (name: string) => args.includes(`--${name}`);

  return {
    provider: (get('provider') as Provider | undefined) ?? 'openai',
    chain: (get('chain') as 'solana' | 'base' | 'bsc' | undefined) ?? undefined,
    json: has('json'),
    compare: has('compare'),
    diffOnly: has('diff-only'),
    failOnMismatch: has('fail-on-mismatch'),
    withHistory: has('with-history'),
    limit: Number(get('limit') ?? ''),
  };
};

const requireEnv = (keys: string[]) => {
  const ok = keys.some((k) => Boolean(process.env[k]));
  if (ok) return;
  throw new Error(`Missing API key env var (expected one of: ${keys.join(', ')})`);
};

const getModel = (provider: Provider): LanguageModelV1 => {
  switch (provider) {
    case 'openai':
      requireEnv(['OPENAI_API_KEY']);
      return openai('gpt-4o-mini');
    case 'anthropic':
      requireEnv(['ANTHROPIC_API_KEY']);
      return anthropic('claude-3-5-sonnet-latest');
    case 'xai':
      requireEnv(['XAI_API_KEY', 'GROK_API_KEY']);
      return xai('grok-beta');
    case 'gemini':
      requireEnv(['GOOGLE_GENERATIVE_AI_API_KEY']);
      return google('gemini-2.0-flash-exp');
    case 'deepseek':
      requireEnv(['DEEPSEEK_API_KEY']);
      return deepseek('deepseek-chat') as LanguageModelV1;
  }
};

const toMessages = (content: string): CoreMessage[] => [{ role: 'user', content }];

const toConversationMessages = (fixture: (typeof routingFixtures)[number]): any[] => {
  const messages: any[] = [{ role: 'user', content: fixture.userMessage }];
  if (fixture.conversation?.lastToolName) {
    messages.unshift({
      role: 'assistant',
      content: '',
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: { toolName: fixture.conversation.lastToolName },
        },
      ],
    });
  }
  return messages;
};

const makeAgentConfig = (chain: 'solana' | 'base' | 'bsc') => {
  if (chain === 'solana') {
    return {
      agents: {
        recommendation: 'recommendation',
        lending: 'lending',
        staking: 'staking',
        wallet: 'wallet',
        trading: 'trading',
        market: 'market',
        'token-analysis': 'token-analysis',
        liquidity: 'liquidity',
        knowledge: 'knowledge',
      } as const,
    };
  }

  if (chain === 'base') {
    return {
      agents: {
        knowledge: 'knowledge',
        wallet: 'wallet',
        market: 'market',
        liquidity: 'liquidity',
        trading: 'trading',
        'token-analysis': 'token-analysis',
      } as const,
    };
  }

  return {
    agents: {
      knowledge: 'knowledge',
      wallet: 'wallet',
      market: 'market',
      trading: 'trading',
      'token-analysis': 'token-analysis',
    } as const,
  };
};

const main = async () => {
  const { provider, chain, json, compare, diffOnly, failOnMismatch, withHistory, limit } =
    parseArgs();
  const model = getModel(provider);

  const fixtures = routingFixtures
    .filter((f) => (chain ? f.chain === chain : true))
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : undefined);

  let mismatches = 0;

  for (const fixture of fixtures) {
    const intent = await classifyIntent({
      model,
      messages: toMessages(fixture.userMessage),
      chain: fixture.chain,
    });

    const flowState = withHistory
      ? deriveFlowStateFromConversation({ intent, messages: toConversationMessages(fixture) })
      : deriveFlowStateFromIntent(intent);

    const decision = routeIntent(intent, makeAgentConfig(fixture.chain), flowState);

    const expectedAgent = fixture.expected.agentKey;
    const expectedMode = fixture.expected.mode;
    const mismatch =
      compare && (decision.agentName !== expectedAgent || decision.mode !== expectedMode);

    if (mismatch) mismatches += 1;
    if (diffOnly && !mismatch) continue;

    const row = {
      name: fixture.name,
      chain: fixture.chain,
      userMessage: fixture.userMessage,
      intent,
      route: decision,
      ...(compare
        ? {
            expected: fixture.expected,
            mismatch: mismatch
              ? {
                  expected: { agent: expectedAgent, mode: expectedMode },
                  actual: { agent: decision.agentName, mode: decision.mode },
                }
              : null,
          }
        : {}),
    };

    // eslint-disable-next-line no-console
    console.log(json ? JSON.stringify(row) : row);
  }

  if (failOnMismatch && mismatches > 0) {
    throw new Error(`${mismatches} fixture(s) did not match expected route`);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(
    `inspect-routing failed: ${(error as Error)?.message ?? String(error)}\n\n` +
      `Usage: yarn -s inspect:routing --provider openai --chain solana --json\n` +
      `       yarn -s inspect:routing --provider openai --compare --diff-only\n` +
      `       yarn -s inspect:routing --provider openai --with-history --compare --diff-only\n` +
      `Set the provider API key env var before running.`,
  );
  process.exit(1);
});
