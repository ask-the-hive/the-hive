import { Intent } from '@/ai/routing/intent';
import { FlowMode, FlowState } from '@/ai/routing/route-intent';

export function deriveFlowStateFromIntent(intent: Intent): FlowState {
  const mode: FlowMode =
    intent.goal === 'execute' || intent.explicitExecution
      ? 'execute'
      : intent.goal === 'decide' || intent.decisionStrength !== 'none'
        ? 'decide'
        : 'explore';

  return { mode };
}
