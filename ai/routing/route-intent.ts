import { Intent } from '@/ai/routing/intent';

export type FlowMode = 'explore' | 'decide' | 'execute';

export type FlowState = {
  mode: FlowMode;
  hasWalletAddress?: boolean;
};

export type AgentKey =
  | 'recommendation'
  | 'lending'
  | 'staking'
  | 'wallet'
  | 'trading'
  | 'market'
  | 'token-analysis'
  | 'liquidity'
  | 'knowledge';

export type RouteIntentConfig = {
  agents: Record<AgentKey, string>;
};

export type RouteDecision = {
  agentName: string | null;
  mode: FlowMode;
  reason:
    | 'explicit_trading'
    | 'explicit_execute'
    | 'decision_request'
    | 'learn_request'
    | 'explore_specific'
    | 'explore_ambiguous';
};

export function routeIntent(
  intent: Intent,
  config: RouteIntentConfig,
  flowState: FlowState = { mode: 'explore' },
): RouteDecision {
  const { agents } = config;

  if (intent.explicitTrading) {
    return { agentName: agents.trading, mode: 'execute', reason: 'explicit_trading' };
  }

  if (intent.goal === 'execute' || intent.explicitExecution) {
    if (intent.domain === 'staking' || intent.assetScope === 'sol') {
      return { agentName: agents.staking, mode: 'execute', reason: 'explicit_execute' };
    }
    if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') {
      return { agentName: agents.lending, mode: 'execute', reason: 'explicit_execute' };
    }

    if (intent.domain === 'portfolio') {
      return { agentName: agents.wallet, mode: 'execute', reason: 'explicit_execute' };
    }

    if (intent.domain === 'liquidity') {
      return { agentName: agents.liquidity, mode: 'execute', reason: 'explicit_execute' };
    }

    return { agentName: agents.recommendation, mode: 'decide', reason: 'explicit_execute' };
  }

  if (intent.goal === 'decide' || intent.decisionStrength !== 'none') {
    return { agentName: agents.recommendation, mode: 'decide', reason: 'decision_request' };
  }

  if (intent.goal === 'learn' || intent.domain === 'knowledge') {
    return { agentName: agents.knowledge, mode: 'explore', reason: 'learn_request' };
  }

  // explore / unknown
  if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') {
    return { agentName: agents.lending, mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'staking' || intent.assetScope === 'sol') {
    return { agentName: agents.staking, mode: flowState.mode, reason: 'explore_specific' };
  }

  if (intent.domain === 'market') {
    return { agentName: agents.market, mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'token-analysis') {
    return { agentName: agents['token-analysis'], mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'liquidity') {
    return { agentName: agents.liquidity, mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'portfolio') {
    return { agentName: agents.wallet, mode: flowState.mode, reason: 'explore_specific' };
  }

  return { agentName: null, mode: flowState.mode, reason: 'explore_ambiguous' };
}

