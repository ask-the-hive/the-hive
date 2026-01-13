import { CoreMessage, LanguageModelV1, Message } from 'ai';

import { Agent } from '@/ai/agent';
import { baseKnowledgeAgent } from '@/ai/agents/base-knowledge';
import { baseTokenAnalysisAgent } from '@/ai/agents/base-token-analysis';
import { baseWalletAgent } from '@/ai/agents/base-wallet';
import { baseMarketAgent } from '@/ai/agents/base-market';
import { baseLiquidityAgent } from '@/ai/agents/base-liquidity';
import { baseTradingAgent } from '@/ai/agents/base-trading';
import { classifyIntent } from '@/ai/routing/classify-intent';
import { Intent } from '@/ai/routing/intent';
import { deriveFlowStateFromConversation } from '@/ai/routing/derive-flow-state';
import { routeIntent, RouteDecision } from '@/ai/routing/route-intent';
import { getLastClientAction, intentFromClientAction } from '@/ai/routing/client-action';

// List of Base-specific agents
export const baseAgents: Agent[] = [
  baseKnowledgeAgent,
  baseTokenAnalysisAgent,
  baseWalletAgent,
  baseMarketAgent,
  baseLiquidityAgent,
  baseTradingAgent,
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
  const clientAction = getLastClientAction(messages);
  const intent = clientAction
    ? intentFromClientAction(clientAction)
    : await classifyIntent({
        model,
        messages: toCoreMessages(messages),
        chain: 'base',
      });

  const decision = routeIntent(
    intent,
    {
      agents: {
        knowledge: baseKnowledgeAgent.name,
        wallet: baseWalletAgent.name,
        market: baseMarketAgent.name,
        liquidity: baseLiquidityAgent.name,
        trading: baseTradingAgent.name,
        'token-analysis': baseTokenAnalysisAgent.name,
      },
    },
    deriveFlowStateFromConversation({ intent, messages }),
  );

  const agent = decision.agentName
    ? (baseAgents.find((a) => a.name === decision.agentName) ?? null)
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
