import type { Message } from 'ai';
import type { Intent } from '@/ai/routing/intent';

export type ClientAction =
  | {
      type: 'execute_lend';
      chain: 'solana';
      tokenSymbol: string;
      tokenAddress: string;
      protocol: string;
    }
  | {
      type: 'execute_stake';
      chain: 'solana';
      lstSymbol: string;
    };

type Annotation = { clientAction?: ClientAction } & Record<string, unknown>;

const getMessageAnnotations = (message: Message | undefined): Annotation[] => {
  if (!message) return [];
  const anyMessage = message as any;
  const annotations = anyMessage.annotations;
  return Array.isArray(annotations) ? (annotations as Annotation[]) : [];
};

export function getLastClientAction(messages: Message[]): ClientAction | null {
  // Client actions are per-message UI intents (e.g., user clicked an "Execute" CTA).
  // They must NOT leak across turns; only consider the most recent user message.
  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const msg = messages[idx];
    if (msg?.role !== 'user') continue;
    const annotations = getMessageAnnotations(msg);
    for (let a = annotations.length - 1; a >= 0; a -= 1) {
      const action = annotations[a]?.clientAction;
      if (action) return action;
    }
    return null;
  }
  return null;
}

export function intentFromClientAction(action: ClientAction): Intent {
  if (action.type === 'execute_lend') {
    return {
      domain: 'lending',
      goal: 'execute',
      decisionStrength: 'none',
      objective: 'unknown',
      assetScope: 'stablecoins',
      explicitTrading: false,
      explicitExecution: true,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  // execute_stake
  return {
    domain: 'staking',
    goal: 'execute',
    decisionStrength: 'none',
    objective: 'unknown',
    assetScope: 'sol',
    explicitTrading: false,
    explicitExecution: true,
    needsWalletForPersonalization: false,
    confidence: 1,
  };
}
