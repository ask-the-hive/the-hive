import { Intent } from '@/ai/routing/intent';
import { RouteDecision } from '@/ai/routing/route-intent';

type RoutingDebugEvent = {
  chain: 'solana' | 'base' | 'bsc' | string;
  decision: RouteDecision;
  intent: Pick<
    Intent,
    | 'domain'
    | 'goal'
    | 'decisionStrength'
    | 'assetScope'
    | 'explicitTrading'
    | 'explicitExecution'
    | 'needsWalletForPersonalization'
    | 'confidence'
  >;
  agentName: string | null;
  allowWalletConnect: boolean;
  hasWalletAddress: boolean;
  tools: {
    before: number;
    after: number;
  };
  toolPlan?: Record<string, unknown> | string[];
};

export function logRoutingDecision(event: RoutingDebugEvent) {
  if (process.env.ROUTING_DEBUG !== 'true') return;

  // eslint-disable-next-line no-console
  console.info('[routing]', {
    chain: event.chain,
    agentName: event.agentName,
    mode: event.decision.mode,
    reason: event.decision.reason,
    intent: event.intent,
    gating: {
      allowWalletConnect: event.allowWalletConnect,
      hasWalletAddress: event.hasWalletAddress,
      tools: event.tools,
    },
    toolPlan: event.toolPlan,
  });
}
