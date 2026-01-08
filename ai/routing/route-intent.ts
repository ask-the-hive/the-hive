import { Intent } from '@/ai/routing/intent';

export type FlowMode = 'explore' | 'decide' | 'execute';

export type FlowState = {
  mode: FlowMode;
  hasWalletAddress?: boolean;
  lastAgentKey?: AgentKey;
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
  agents: Partial<Record<AgentKey, string>>;
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
  const get = (key: AgentKey) => agents[key] ?? null;

  if (intent.explicitTrading) {
    return { agentName: get('trading'), mode: 'execute', reason: 'explicit_trading' };
  }

  if (intent.goal === 'execute' || intent.explicitExecution) {
    if (intent.domain === 'staking' || intent.assetScope === 'sol') {
      return { agentName: get('staking'), mode: 'execute', reason: 'explicit_execute' };
    }
    if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') {
      return { agentName: get('lending'), mode: 'execute', reason: 'explicit_execute' };
    }

    if (intent.domain === 'portfolio') {
      return { agentName: get('wallet'), mode: 'execute', reason: 'explicit_execute' };
    }

    if (intent.domain === 'liquidity') {
      return { agentName: get('liquidity'), mode: 'execute', reason: 'explicit_execute' };
    }

    return { agentName: get('recommendation'), mode: 'decide', reason: 'explicit_execute' };
  }

  if (intent.goal === 'decide' || intent.decisionStrength !== 'none') {
    if (
      (intent.domain === 'lending' || intent.domain === 'staking') &&
      intent.assetScope === 'unknown'
    ) {
      return { agentName: get('recommendation'), mode: 'decide', reason: 'decision_request' };
    }

    if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') {
      return {
        agentName: get('lending') ?? get('recommendation'),
        mode: 'decide',
        reason: 'decision_request',
      };
    }
    if (intent.domain === 'staking' || intent.assetScope === 'sol') {
      return {
        agentName: get('staking') ?? get('recommendation'),
        mode: 'decide',
        reason: 'decision_request',
      };
    }

    return { agentName: get('recommendation'), mode: 'decide', reason: 'decision_request' };
  }

  if (intent.goal === 'learn' || intent.domain === 'knowledge') {
    return { agentName: get('knowledge'), mode: 'explore', reason: 'learn_request' };
  }

  if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') {
    return { agentName: get('lending'), mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'staking' || intent.assetScope === 'sol') {
    return { agentName: get('staking'), mode: flowState.mode, reason: 'explore_specific' };
  }

  if (intent.domain === 'market') {
    return { agentName: get('market'), mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'token-analysis') {
    return {
      agentName: get('token-analysis'),
      mode: flowState.mode,
      reason: 'explore_specific',
    };
  }
  if (intent.domain === 'liquidity') {
    return { agentName: get('liquidity'), mode: flowState.mode, reason: 'explore_specific' };
  }
  if (intent.domain === 'portfolio') {
    return { agentName: get('wallet'), mode: flowState.mode, reason: 'explore_specific' };
  }

  if (intent.confidence < 0.5 && flowState.lastAgentKey) {
    return {
      agentName: get(flowState.lastAgentKey),
      mode: flowState.mode,
      reason: 'explore_ambiguous',
    };
  }

  const fallback = get('recommendation');
  if (fallback) {
    return { agentName: fallback, mode: flowState.mode, reason: 'explore_ambiguous' };
  }

  return { agentName: null, mode: flowState.mode, reason: 'explore_ambiguous' };
}
