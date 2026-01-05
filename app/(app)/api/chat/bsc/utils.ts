import { CoreMessage, LanguageModelV1, Message } from 'ai';

import { bscTokenAnalysisAgent } from '@/ai/agents/bsc-token-analysis';
import { bscMarketAgent } from '@/ai/agents/bsc-market';
import { bscWalletAgent } from '@/ai/agents/bsc-wallet';
import { bscKnowledgeAgent } from '@/ai/agents/bsc-knowledge';
import { bscLiquidityAgent } from '@/ai/agents/bsc-liquidity';
import { bscTradingAgent } from '@/ai/agents/bsc-trading';
import { Agent } from '@/ai/agent';
import { classifyIntent } from '@/ai/routing/classify-intent';
import { deriveFlowStateFromIntent } from '@/ai/routing/flow-state';
import { Intent } from '@/ai/routing/intent';
import { routeIntent } from '@/ai/routing/route-intent';
import { RouteDecision } from '@/ai/routing/route-intent';

// List of BSC-specific agents
const bscAgents = [
  bscTokenAnalysisAgent,
  bscMarketAgent,
  bscWalletAgent,
  bscKnowledgeAgent,
  bscLiquidityAgent,
  bscTradingAgent,
];

const toCoreMessages = (messages: Message[], limit = 8): CoreMessage[] =>
  messages.slice(-limit).map((m) => ({
    role: m.role === 'assistant' || m.role === 'user' || m.role === 'system' ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
  }));

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
    chain: 'bsc',
  });

  const decision = routeIntent(
    intent,
    {
      agents: {
        knowledge: bscKnowledgeAgent.name,
        wallet: bscWalletAgent.name,
        market: bscMarketAgent.name,
        liquidity: bscLiquidityAgent.name,
        trading: bscTradingAgent.name,
        'token-analysis': bscTokenAnalysisAgent.name,
      },
    },
    deriveFlowStateFromIntent(intent),
  );

  const agent = decision.agentName
    ? bscAgents.find((a) => a.name === decision.agentName) ?? null
    : null;

  return { agent, intent, decision };
};

export const chooseAgent = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<Agent | null> => {
  const { agent } = await chooseRoute(model, messages);
  return agent;
};
