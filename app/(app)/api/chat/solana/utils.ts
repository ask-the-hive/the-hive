import { CoreMessage, LanguageModelV1, Message } from 'ai';
import { agents } from '@/ai/agents';
import { Agent } from '@/ai/agent';
import { LENDING_AGENT_NAME } from '@/ai/agents/lending/name';
import { STAKING_AGENT_NAME } from '@/ai/agents/staking/name';
import { RECOMMENDATION_AGENT_NAME } from '@/ai/agents/recommendation/name';
import { WALLET_AGENT_NAME } from '@/ai/agents/wallet/name';
import { TRADING_AGENT_NAME } from '@/ai/agents/trading/name';
import { MARKET_AGENT_NAME } from '@/ai/agents/market/name';
import { TOKEN_ANALYSIS_AGENT_NAME } from '@/ai/agents/token-analysis/name';
import { LIQUIDITY_AGENT_NAME } from '@/ai/agents/liquidity/name';
import { KNOWLEDGE_AGENT_NAME } from '@/ai/agents/knowledge/name';
import { classifyIntent } from '@/ai/routing/classify-intent';
import { Intent } from '@/ai/routing/intent';
import { deriveFlowStateFromIntent } from '@/ai/routing/flow-state';
import { routeIntent, RouteDecision } from '@/ai/routing/route-intent';

const toCoreMessages = (messages: Message[], limit = 8): CoreMessage[] => {
  return messages.slice(-limit).map((m) => ({
    role: m.role === 'assistant' || m.role === 'user' || m.role === 'system' ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
  }));
};

export type ChooseRouteResult = {
  agent: Agent | null;
  intent: Intent;
  decision: RouteDecision;
};

export const chooseRoute = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<ChooseRouteResult> => {
  const intent = await classifyIntent({
    model,
    messages: toCoreMessages(messages),
    chain: 'solana',
  });

  const decision = routeIntent(
    intent,
    {
      agents: {
        recommendation: RECOMMENDATION_AGENT_NAME,
        lending: LENDING_AGENT_NAME,
        staking: STAKING_AGENT_NAME,
        wallet: WALLET_AGENT_NAME,
        trading: TRADING_AGENT_NAME,
        market: MARKET_AGENT_NAME,
        'token-analysis': TOKEN_ANALYSIS_AGENT_NAME,
        liquidity: LIQUIDITY_AGENT_NAME,
        knowledge: KNOWLEDGE_AGENT_NAME,
      },
    },
    deriveFlowStateFromIntent(intent),
  );

  const agent = decision.agentName ? agents.find((a) => a.name === decision.agentName) ?? null : null;
  return { agent, intent, decision };
};

export const chooseAgent = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<Agent | null> => {
  const { agent } = await chooseRoute(model, messages);
  return agent;
};
