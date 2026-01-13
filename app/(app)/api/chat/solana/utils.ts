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
import { deriveFlowStateFromConversation } from '@/ai/routing/derive-flow-state';
import { routeIntent, RouteDecision } from '@/ai/routing/route-intent';
import { getLastClientAction, intentFromClientAction } from '@/ai/routing/client-action';
import { isStablecoinSymbol, isSupportedSolanaStakingLst } from '@/lib/yield-support';
import {
  SOLANA_LEND_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_WITHDRAW_ACTION,
} from '@/ai/action-names';
import { resolveLendingProjectKey } from '@/lib/lending';

const SOLANA_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const toCoreMessages = (messages: Message[], limit = 8): CoreMessage[] => {
  return messages.slice(-limit).map((m) => ({
    role: m.role === 'assistant' || m.role === 'user' || m.role === 'system' ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
  }));
};

const isWordChar = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    char === '_'
  );
};

const tokenizeToUpper = (text: string): string[] => {
  const normalized = String(text ?? '');
  const tokens: string[] = [];
  let current = '';

  for (let idx = 0; idx < normalized.length; idx += 1) {
    const char = normalized[idx];
    if (isWordChar(char)) {
      current += char;
      continue;
    }
    if (current) {
      tokens.push(current.toUpperCase());
      current = '';
    }
  }

  if (current) tokens.push(current.toUpperCase());
  return tokens;
};

const includesAnyToken = (tokens: string[], needles: string[]) => {
  for (const n of needles) {
    if (tokens.includes(n)) return true;
  }
  return false;
};

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

const lastYieldDomain = (messages: Message[]): 'lending' | 'staking' | null => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const invocations = extractToolInvocations(messages[i]);
    for (let j = invocations.length - 1; j >= 0; j -= 1) {
      const name = String(invocations[j]?.toolName ?? '');
      if (name.endsWith(SOLANA_LENDING_YIELDS_ACTION)) return 'lending';
      if (name.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION)) return 'staking';
    }
  }
  return null;
};

const lastYieldDomainFromText = (messages: Message[]): 'lending' | 'staking' | null => {
  // Fallback when there haven't been tool calls yet (e.g., the model answered in plain text).
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    const content = typeof msg?.content === 'string' ? msg.content : String(msg?.content ?? '');
    const text = content.toLowerCase();
    if (!text) continue;

    if (
      text.includes('lending') ||
      text.includes('lend ') ||
      text.includes('deposit') ||
      text.includes('jupiter lend') ||
      text.includes('kamino')
    ) {
      return 'lending';
    }

    if (text.includes('staking') || text.includes('stake ') || text.includes('jupsol')) {
      return 'staking';
    }
  }
  return null;
};

const looksLikeRetry = (rawText: string): boolean => {
  const text = String(rawText || '').toLowerCase();
  if (!text) return false;
  if (text.includes('retry')) return true;
  if (text.includes('try again')) return true;
  // Catch common typos like "try agin"
  if (text.includes('try ag')) return true;
  // "again" alone is too broad, but "try" + "again/agin" is usually a retry.
  if (text.includes('try') && (text.includes('again') || text.includes('agin'))) return true;
  return false;
};

type ActionDomain = 'lending' | 'staking' | 'trading' | 'portfolio' | null;

const normalizeToolName = (toolName: unknown) =>
  String(toolName || '')
    .toLowerCase()
    .split('-')
    .join('_');

const toolMatchesAction = (toolName: unknown, action: string) => {
  const normalized = normalizeToolName(toolName);
  const needle = String(action).toLowerCase();
  return normalized.includes(needle);
};

const getResumeActionFromAnnotations = (messages: Message[]) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const annotations = (messages[i] as any)?.annotations;
    if (!Array.isArray(annotations)) continue;
    for (let j = annotations.length - 1; j >= 0; j -= 1) {
      const resumeAction = annotations[j]?.resumeAction;
      if (resumeAction) return resumeAction as { toolName?: string; status?: string };
    }
  }
  return null;
};

const lastFailedOrCancelledActionDomain = (messages: Message[]): ActionDomain => {
  const resumeAction = getResumeActionFromAnnotations(messages);
  if (resumeAction?.toolName && (resumeAction.status === 'cancelled' || resumeAction.status === 'failed')) {
    if (
      toolMatchesAction(resumeAction.toolName, SOLANA_STAKE_ACTION) ||
      toolMatchesAction(resumeAction.toolName, SOLANA_UNSTAKE_ACTION)
    ) {
      return 'staking';
    }
    if (
      toolMatchesAction(resumeAction.toolName, SOLANA_LEND_ACTION) ||
      toolMatchesAction(resumeAction.toolName, SOLANA_WITHDRAW_ACTION)
    ) {
      return 'lending';
    }
    if (toolMatchesAction(resumeAction.toolName, SOLANA_TRADE_ACTION)) return 'trading';
    if (toolMatchesAction(resumeAction.toolName, SOLANA_TRANSFER_NAME)) return 'portfolio';
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const invocations = extractToolInvocations(messages[i]);
    for (let j = invocations.length - 1; j >= 0; j -= 1) {
      const inv = invocations[j] as any;
      if (inv?.state !== 'result') continue;
      const status = inv?.result?.body?.status;
      if (status !== 'cancelled' && status !== 'failed') continue;

      if (
        toolMatchesAction(inv.toolName, SOLANA_STAKE_ACTION) ||
        toolMatchesAction(inv.toolName, SOLANA_UNSTAKE_ACTION)
      ) {
        return 'staking';
      }
      if (
        toolMatchesAction(inv.toolName, SOLANA_LEND_ACTION) ||
        toolMatchesAction(inv.toolName, SOLANA_WITHDRAW_ACTION)
      ) {
        return 'lending';
      }
      if (toolMatchesAction(inv.toolName, SOLANA_TRADE_ACTION)) return 'trading';
      if (toolMatchesAction(inv.toolName, SOLANA_TRANSFER_NAME)) return 'portfolio';
    }
  }
  return null;
};

function inferDeterministicIntent(messages: Message[]): Intent | null {
  const lastUserMessage = [...messages].reverse().find((m) => {
    if (m.role !== 'user') return false;
    const annotations = (m as any).annotations;
    if (!Array.isArray(annotations)) return true;
    return !annotations.some((a) => a && typeof a === 'object' && (a as any).internal === true);
  });
  const text = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';
  if (!text) return null;

  // Retry/resume: "try again" should continue the most recent cancelled/failed action
  // using the conversation context, rather than becoming a no-op.
  if (looksLikeRetry(text)) {
    const domain = lastFailedOrCancelledActionDomain(messages);
    if (domain === 'lending') {
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
    if (domain === 'staking') {
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
    if (domain === 'trading') {
      return {
        domain: 'trading',
        goal: 'execute',
        decisionStrength: 'none',
        objective: 'unknown',
        assetScope: 'unknown',
        explicitTrading: true,
        explicitExecution: true,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }
    if (domain === 'portfolio') {
      return {
        domain: 'portfolio',
        goal: 'execute',
        decisionStrength: 'none',
        objective: 'unknown',
        assetScope: 'unknown',
        explicitTrading: false,
        explicitExecution: true,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }
  }

  const tokens = tokenizeToUpper(text);
  const stablecoinToken = tokens.find((t) => isStablecoinSymbol(t));
  const protocolKey = resolveLendingProjectKey(text);
  const addressMatch = text.match(SOLANA_ADDRESS_PATTERN)?.[0];

  // "Give me all lending pools" should default to APY sorting (not TVL).
  if (
    tokens.includes('ALL') &&
    includesAnyToken(tokens, ['POOL', 'POOLS', 'OPTIONS', 'OPTION']) &&
    includesAnyToken(tokens, ['LEND', 'LENDING'])
  ) {
    return {
      domain: 'lending',
      goal: 'explore',
      decisionStrength: 'none',
      objective: 'highest_yield',
      assetScope: 'stablecoins',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  // "Give me all pools" should preserve the current yield context and default to APY sorting.
  if (
    tokens.includes('ALL') &&
    includesAnyToken(tokens, ['POOL', 'POOLS', 'OPTIONS', 'OPTION']) &&
    !includesAnyToken(tokens, ['TVL', 'LIQUIDITY'])
  ) {
    const context = lastYieldDomain(messages) ?? lastYieldDomainFromText(messages);
    if (context === 'lending') {
      return {
        domain: 'lending',
        goal: 'explore',
        decisionStrength: 'none',
        objective: 'highest_yield',
        assetScope: 'stablecoins',
        explicitTrading: false,
        explicitExecution: false,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }
    if (context === 'staking') {
      return {
        domain: 'staking',
        goal: 'explore',
        decisionStrength: 'none',
        objective: 'highest_yield',
        assetScope: 'sol',
        explicitTrading: false,
        explicitExecution: false,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }

    return {
      domain: 'lending',
      goal: 'explore',
      decisionStrength: 'none',
      objective: 'highest_yield',
      assetScope: 'stablecoins',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 0.9,
    };
  }

  // TVL-focused lending questions: treat "highest TVL" as a "safest" heuristic.
  // Keep this in explore mode so the agent shows cards (not a decision-response block).
  if (
    includesAnyToken(tokens, ['TVL', 'LIQUIDITY']) &&
    includesAnyToken(tokens, ['HIGHEST', 'MOST', 'LARGEST', 'MAX']) &&
    includesAnyToken(tokens, ['POOL', 'POOLS', 'ONE', 'WHICH', 'BEST', 'OPTION', 'OPTIONS'])
  ) {
    const context = lastYieldDomain(messages) ?? lastYieldDomainFromText(messages);
    const domain = context ?? 'lending';
    return {
      domain,
      goal: 'explore',
      decisionStrength: 'none',
      objective: 'safest',
      assetScope: domain === 'staking' ? 'sol' : 'stablecoins',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  // Follow-up "which one has the highest yield/APY?" should show yield cards, not a generic text answer.
  if (
    includesAnyToken(tokens, ['HIGHEST', 'BEST', 'TOP']) &&
    includesAnyToken(tokens, ['YIELD', 'APY', 'APR']) &&
    (includesAnyToken(tokens, ['POOL', 'POOLS', 'OPTION', 'OPTIONS', 'ONE', 'WHICH']) ||
      tokens.includes('WHICH'))
  ) {
    const context = lastYieldDomain(messages);
    const domain = context ?? (includesAnyToken(tokens, ['STAKE', 'STAKING']) ? 'staking' : 'lending');
    return {
      domain,
      goal: 'explore',
      decisionStrength: 'none',
      objective: 'highest_yield',
      assetScope: domain === 'staking' ? 'sol' : 'stablecoins',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  // Explicit withdraw from lending protocols (token/protocol may be omitted).
  if (
    includesAnyToken(tokens, ['WITHDRAW', 'WITHDRAWAL', 'REDEEM']) &&
    includesAnyToken(tokens, ['LEND', 'LENDING', 'POOL', 'PROTOCOL', 'KAMINO', 'JUPITER'])
  ) {
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

  // Typed explicit lending execution (even without a clientAction annotation).
  // Example: "I want to deposit USDG (mint) into Jupiter Lend"
  if (
    stablecoinToken &&
    addressMatch &&
    protocolKey &&
    includesAnyToken(tokens, ['DEPOSIT', 'LEND', 'LENDING'])
  ) {
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

  // Handle UI CTA follow-ups like "View safest pool" by anchoring to the last yield context.
  if (
    includesAnyToken(tokens, ['SAFEST']) &&
    includesAnyToken(tokens, ['POOL', 'POOLS']) &&
    includesAnyToken(tokens, ['VIEW', 'SHOW'])
  ) {
    const context = lastYieldDomain(messages);
    if (context === 'lending') {
      return {
        domain: 'lending',
        goal: 'explore',
        decisionStrength: 'none',
        objective: 'safest',
        assetScope: 'stablecoins',
        explicitTrading: false,
        explicitExecution: false,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }
    if (context === 'staking') {
      return {
        domain: 'staking',
        goal: 'explore',
        decisionStrength: 'none',
        objective: 'safest',
        assetScope: 'sol',
        explicitTrading: false,
        explicitExecution: false,
        needsWalletForPersonalization: false,
        confidence: 1,
      };
    }
  }

  if (
    stablecoinToken &&
    includesAnyToken(tokens, [
      'APY',
      'YIELD',
      'EARN',
      'POOL',
      'POOLS',
      'LEND',
      'LENDING',
      'DEPOSIT',
    ])
  ) {
    const strong =
      includesAnyToken(tokens, ['BEST', 'HIGHEST', 'OPTIMAL', 'SAFEST']) ||
      (tokens.includes('RIGHT') && tokens.includes('NOW'));
    const objective = includesAnyToken(tokens, ['SAFEST']) ? 'safest' : 'highest_yield';

    return {
      domain: 'lending',
      goal: strong ? 'decide' : 'explore',
      decisionStrength: strong ? 'strong' : 'none',
      objective,
      assetScope: 'stablecoins',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  if (
    !stablecoinToken &&
    includesAnyToken(tokens, ['STAKE', 'STAKING']) &&
    includesAnyToken(tokens, ['YIELD', 'YIELDS', 'APY', 'APR', 'RATE']) &&
    (includesAnyToken(tokens, ['BEST', 'HIGHEST', 'OPTIMAL', 'SAFEST']) ||
      (tokens.includes('RIGHT') && tokens.includes('NOW')))
  ) {
    const objective = includesAnyToken(tokens, ['SAFEST']) ? 'safest' : 'highest_yield';
    return {
      domain: 'staking',
      goal: 'decide',
      decisionStrength: 'strong',
      objective,
      assetScope: 'sol',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  const lstToken = tokens.find((t) => isSupportedSolanaStakingLst(t));
  if (lstToken && includesAnyToken(tokens, ['STAKE', 'STAKING', 'APY', 'YIELD', 'EARN'])) {
    const wantsSwap =
      tokens.includes('STAKE') &&
      tokens.includes('SOL') &&
      includesAnyToken(tokens, ['FOR', 'INTO', 'TO']);
    if (wantsSwap) {
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

    const strong =
      includesAnyToken(tokens, ['BEST', 'HIGHEST', 'OPTIMAL', 'SAFEST']) ||
      (tokens.includes('RIGHT') && tokens.includes('NOW'));
    const objective = includesAnyToken(tokens, ['SAFEST']) ? 'safest' : 'highest_yield';

    return {
      domain: 'staking',
      goal: strong ? 'decide' : 'explore',
      decisionStrength: strong ? 'strong' : 'none',
      objective,
      assetScope: 'sol',
      explicitTrading: false,
      explicitExecution: false,
      needsWalletForPersonalization: false,
      confidence: 1,
    };
  }

  return null;
}

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
    : (inferDeterministicIntent(messages) ??
      (await classifyIntent({
        model,
        messages: toCoreMessages(messages),
        chain: 'solana',
      })));

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
    deriveFlowStateFromConversation({ intent, messages }),
  );

  const agent = decision.agentName
    ? (agents.find((a) => a.name === decision.agentName) ?? null)
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
