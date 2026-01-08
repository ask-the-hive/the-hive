import { Message } from 'ai';
import { Intent } from '@/ai/routing/intent';
import { AgentKey, FlowMode, FlowState } from '@/ai/routing/route-intent';
import {
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
} from '@/ai/action-names';

type ToolInvocation = { toolName?: string; state?: string };

const extractToolInvocations = (message: Message | undefined): ToolInvocation[] => {
  if (!message) return [];
  const anyMessage = message as any;

  if (Array.isArray(anyMessage.parts)) {
    return (anyMessage.parts as any[])
      .filter((part) => part && part.type === 'tool-invocation' && part.toolInvocation)
      .map((part) => part.toolInvocation as ToolInvocation);
  }

  const legacy = anyMessage.toolInvocations as ToolInvocation[] | undefined;
  return legacy ?? [];
};

const lastToolInvocation = (messages: Message[]): ToolInvocation | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const invocations = extractToolInvocations(messages[i]);
    if (invocations.length) return invocations[invocations.length - 1] ?? null;
  }
  return null;
};

const lastYieldInvocation = (messages: Message[]): ToolInvocation | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const invocations = extractToolInvocations(messages[i]);
    for (let j = invocations.length - 1; j >= 0; j -= 1) {
      const name = String(invocations[j]?.toolName ?? '');
      if (
        name.endsWith(SOLANA_LENDING_YIELDS_ACTION) ||
        name.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION)
      ) {
        return invocations[j] ?? null;
      }
    }
  }
  return null;
};

const parseAgentKeyFromToolName = (toolName: string): AgentKey | null => {
  const prefix = toolName.split('-')[0] ?? '';

  const direct: Record<string, AgentKey> = {
    // Solana
    lending: 'lending',
    staking: 'staking',
    recommendation: 'recommendation',
    wallet: 'wallet',
    trading: 'trading',
    market: 'market',
    tokenanalysis: 'token-analysis',
    liquidity: 'liquidity',
    knowledge: 'knowledge',

    basewallet: 'wallet',
    basetrading: 'trading',
    basemarket: 'market',
    basetokenanalysis: 'token-analysis',
    baseliquidity: 'liquidity',
    baseknowledge: 'knowledge',

    bscwallet: 'wallet',
    bsctrading: 'trading',
    bscmarket: 'market',
    bsctokenanalysis: 'token-analysis',
    bscliquidity: 'liquidity',
    bscknowledge: 'knowledge',
  };

  return direct[prefix] ?? null;
};

const modeFromIntent = (intent: Intent): FlowMode => {
  if (intent.goal === 'execute' || intent.explicitExecution) return 'execute';
  if (intent.goal === 'decide' || intent.decisionStrength !== 'none') return 'decide';
  return 'explore';
};

export function deriveFlowStateFromConversation(args: {
  intent: Intent;
  messages: Message[];
}): FlowState {
  const { intent, messages } = args;

  const mode = modeFromIntent(intent);
  const last = lastYieldInvocation(messages) ?? lastToolInvocation(messages);
  const toolName = last?.toolName ?? '';
  const lastAgentKey = toolName ? parseAgentKeyFromToolName(toolName) : null;

  const sawYieldCardsRecently = Boolean(lastYieldInvocation(messages));

  const hasRecentAgentContext = Boolean(lastAgentKey);

  const adjustedMode: FlowMode =
    intent.confidence < 0.5 &&
    mode === 'explore' &&
    (sawYieldCardsRecently || hasRecentAgentContext)
      ? 'decide'
      : mode;

  return { mode: adjustedMode, lastAgentKey: lastAgentKey ?? undefined };
}
