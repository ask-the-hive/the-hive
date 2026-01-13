import { CoreMessage, generateObject, LanguageModelV1, Message } from 'ai';
import { z } from 'zod';
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

export type RouterAgentKey =
  | 'lending'
  | 'staking'
  | 'trading'
  | 'wallet'
  | 'knowledge'
  | 'recommendation';
export type RouterMode = 'explore' | 'decide' | 'execute';
export type RouterUi = 'cards' | 'cards_then_text' | 'text';
export type RouterStopCondition =
  | 'when_first_yields_result_received'
  | 'after_tool_plan_complete'
  | 'none';

export type RouterToolPlanItem = {
  tool: string;
  args?: Record<string, unknown>;
};

export type SolanaRouterDecision = {
  agent: RouterAgentKey;
  mode: RouterMode;
  ui: RouterUi;
  toolPlan: RouterToolPlanItem[];
  stopCondition: RouterStopCondition;
};

const RouterToolPlanItemSchema = z.object({
  tool: z.string(),
  args: z.record(z.any()).optional(),
});

export const SolanaRouterDecisionSchema = z.object({
  agent: z.enum(['lending', 'staking', 'trading', 'wallet', 'knowledge', 'recommendation']),
  mode: z.enum(['explore', 'decide', 'execute']),
  ui: z.enum(['cards', 'cards_then_text', 'text']),
  toolPlan: z.array(RouterToolPlanItemSchema).default([]),
  stopCondition: z
    .enum(['when_first_yields_result_received', 'after_tool_plan_complete', 'none'])
    .default('none'),
});

type YieldPoolSample = {
  symbol: string;
  project?: string;
  apy?: number;
  tvlUsd?: number;
  tokenMintAddress?: string;
};

export type SolanaRouterContext = {
  lastYield: {
    tool: string;
    args?: Record<string, unknown>;
    pools?: YieldPoolSample[];
  } | null;
  lastAction: {
    tool: string;
    args?: Record<string, unknown>;
    status?: string;
  } | null;
};

type ToolInvocation = {
  toolName?: string;
  state?: string;
  args?: unknown;
  result?: unknown;
};

type ResumeActionAnnotation = {
  toolName?: string;
  args?: Record<string, unknown>;
  status?: string;
};

const isInternalUserMessage = (message: Message | undefined): boolean => {
  if (!message || message.role !== 'user') return false;
  const annotations = (message as any)?.annotations;
  if (!Array.isArray(annotations)) return false;
  return annotations.some((a) => a && typeof a === 'object' && (a as any).internal === true);
};

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

const getResumeActionFromAnnotations = (messages: Message[]): ResumeActionAnnotation | null => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const annotations = (messages[i] as any)?.annotations;
    if (!Array.isArray(annotations)) continue;
    for (let j = annotations.length - 1; j >= 0; j -= 1) {
      const resumeAction = annotations[j]?.resumeAction;
      if (resumeAction) return resumeAction as ResumeActionAnnotation;
    }
  }
  return null;
};

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

const resolveAgentFromToolName = (toolName: unknown): RouterAgentKey | null => {
  const normalized = String(toolName || '').toLowerCase();
  if (normalized.startsWith('lending-')) return 'lending';
  if (normalized.startsWith('staking-')) return 'staking';
  if (normalized.startsWith('trading-')) return 'trading';
  if (normalized.startsWith('wallet-')) return 'wallet';
  if (normalized.startsWith('knowledge-')) return 'knowledge';
  if (normalized.startsWith('recommendation-')) return 'recommendation';
  return null;
};

const isResumeActionTool = (toolName: unknown): boolean =>
  toolMatchesAction(toolName, SOLANA_LEND_ACTION) ||
  toolMatchesAction(toolName, SOLANA_WITHDRAW_ACTION) ||
  toolMatchesAction(toolName, SOLANA_STAKE_ACTION) ||
  toolMatchesAction(toolName, SOLANA_UNSTAKE_ACTION) ||
  toolMatchesAction(toolName, SOLANA_TRADE_ACTION) ||
  toolMatchesAction(toolName, SOLANA_TRANSFER_NAME);

const resolveAgentForActionTool = (toolName: unknown): RouterAgentKey => {
  const fromPrefix = resolveAgentFromToolName(toolName);
  if (fromPrefix) return fromPrefix;
  if (
    toolMatchesAction(toolName, SOLANA_STAKE_ACTION) ||
    toolMatchesAction(toolName, SOLANA_UNSTAKE_ACTION)
  ) {
    return 'staking';
  }
  if (toolMatchesAction(toolName, SOLANA_TRADE_ACTION)) return 'trading';
  if (toolMatchesAction(toolName, SOLANA_TRANSFER_NAME)) return 'wallet';
  return 'lending';
};

const lastUserText = (messages: Message[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;
    if (isInternalUserMessage(msg)) continue;
    return typeof msg.content === 'string' ? msg.content : String(msg.content ?? '');
  }
  return '';
};

const summarizeYieldPools = (body: unknown): YieldPoolSample[] => {
  if (!Array.isArray(body)) return [];
  return body
    .slice(0, 6)
    .map((pool: any) => ({
      symbol: String(pool?.tokenData?.symbol || pool?.symbol || '').toUpperCase(),
      project: pool?.project ? String(pool.project) : undefined,
      apy: Number.isFinite(pool?.yield) ? Number(pool.yield) : undefined,
      tvlUsd: Number.isFinite(pool?.tvlUsd) ? Number(pool.tvlUsd) : undefined,
      tokenMintAddress: String(pool?.tokenMintAddress || pool?.tokenData?.id || ''),
    }))
    .filter((pool) => pool.symbol);
};

export const buildSolanaRouterContext = (messages: Message[]): SolanaRouterContext => {
  let lastYield: SolanaRouterContext['lastYield'] = null;
  let lastAction: SolanaRouterContext['lastAction'] = null;

  const resumeAction = getResumeActionFromAnnotations(messages);
  if (resumeAction?.toolName && isResumeActionTool(resumeAction.toolName)) {
    lastAction = {
      tool: resumeAction.toolName,
      args: resumeAction.args,
      status: resumeAction.status,
    };
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const invocations = extractToolInvocations(messages[i]);
    for (let j = invocations.length - 1; j >= 0; j -= 1) {
      const inv = invocations[j];
      const toolName = String(inv.toolName || '');

      if (!lastYield) {
        if (
          toolMatchesAction(toolName, SOLANA_LENDING_YIELDS_ACTION) ||
          toolMatchesAction(toolName, SOLANA_LIQUID_STAKING_YIELDS_ACTION)
        ) {
          lastYield = {
            tool: toolName,
            args: (inv.args as Record<string, unknown>) ?? undefined,
            pools: summarizeYieldPools((inv as any)?.result?.body),
          };
        }
      }

      if (!lastAction) {
        if (isResumeActionTool(toolName)) {
          const status = (inv as any)?.result?.body?.status;
          lastAction = {
            tool: toolName,
            args: (inv.args as Record<string, unknown>) ?? undefined,
            status: status ? String(status) : undefined,
          };
        }
      }

      if (lastYield && lastAction) return { lastYield, lastAction };
    }
  }

  return { lastYield, lastAction };
};

export const buildSolanaRouterInput = (messages: Message[]) => {
  return {
    lastUserText: lastUserText(messages),
    context: buildSolanaRouterContext(messages),
  };
};

const tokenizeToUpper = (text: string): string[] => {
  const normalized = String(text ?? '');
  const tokens: string[] = [];
  let current = '';

  const isWordChar = (char: string) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122) || // a-z
      char === '_'
    );
  };

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

const looksLikeRetry = (rawText: string): boolean => {
  const text = String(rawText || '').toLowerCase();
  if (!text) return false;
  if (text.includes('retry')) return true;
  if (text.includes('try again')) return true;
  if (text.includes('try ag')) return true;
  if (text.includes('try') && (text.includes('again') || text.includes('agin'))) return true;
  return false;
};

const resolveYieldDomain = (text: string, context: SolanaRouterContext): 'lending' | 'staking' => {
  const lastYieldTool = context.lastYield?.tool ?? '';
  if (toolMatchesAction(lastYieldTool, SOLANA_LIQUID_STAKING_YIELDS_ACTION)) return 'staking';
  if (toolMatchesAction(lastYieldTool, SOLANA_LENDING_YIELDS_ACTION)) return 'lending';

  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('stake') || normalized.includes('staking') || normalized.includes('lst')) {
    return 'staking';
  }

  return 'lending';
};

const planYieldTool = (
  text: string,
  context: SolanaRouterContext,
): { tool: string; args: Record<string, unknown>; ui: RouterUi; stop: RouterStopCondition } | null => {
  const tokens = tokenizeToUpper(text);
  const normalized = String(text || '').toLowerCase();

  const asksAll =
    tokens.includes('ALL') &&
    (tokens.includes('POOL') ||
      tokens.includes('POOLS') ||
      tokens.includes('OPTIONS') ||
      tokens.includes('OPTION') ||
      tokens.includes('PROVIDERS') ||
      tokens.includes('PROVIDER') ||
      tokens.includes('CARDS') ||
      tokens.includes('CARD'));

  const asksTvl =
    tokens.includes('TVL') || normalized.includes('total value locked') || tokens.includes('LIQUIDITY');
  const asksYield = tokens.includes('APY') || tokens.includes('YIELD') || tokens.includes('APR');
  const asksHighest =
    tokens.includes('HIGHEST') ||
    tokens.includes('BEST') ||
    tokens.includes('TOP') ||
    tokens.includes('MOST') ||
    tokens.includes('MAX') ||
    tokens.includes('LARGEST');
  const referencesPools =
    tokens.includes('POOL') ||
    tokens.includes('POOLS') ||
    tokens.includes('OPTIONS') ||
    tokens.includes('OPTION') ||
    normalized.includes('out of these') ||
    normalized.includes('of these') ||
    normalized.includes('among these');

  if (!referencesPools && !asksAll && !asksHighest && !asksYield && !asksTvl) return null;

  const domain = resolveYieldDomain(text, context);
  const tool =
    domain === 'staking' ? SOLANA_LIQUID_STAKING_YIELDS_ACTION : SOLANA_LENDING_YIELDS_ACTION;

  const args: Record<string, unknown> = {};
  const previousArgs = context.lastYield?.args ?? {};
  const prevLimit = Number.isFinite((previousArgs as any).limit)
    ? (previousArgs as any).limit
    : undefined;

  if (asksAll || normalized.includes('out of these') || normalized.includes('of these')) {
    args.limit = 50;
  } else if (prevLimit && referencesPools) {
    args.limit = prevLimit;
  }

  if (asksTvl) args.sortBy = 'tvl';
  if (asksYield && !asksTvl) args.sortBy = 'apy';

  const ui: RouterUi = asksHighest || asksYield || asksTvl ? 'cards_then_text' : 'cards';
  const stop: RouterStopCondition =
    ui === 'cards' ? 'when_first_yields_result_received' : 'after_tool_plan_complete';

  return { tool, args, ui, stop };
};

export const getSolanaRouterFallbackDecision = (
  text: string,
  context: SolanaRouterContext,
): SolanaRouterDecision => {
  if (looksLikeRetry(text) && context.lastAction) {
    const status = String(context.lastAction.status || '');
    if (status === 'cancelled' || status === 'failed') {
      const toolName = context.lastAction.tool;
      return {
        agent: resolveAgentForActionTool(toolName),
        mode: 'execute',
        ui: 'text',
        toolPlan: [
          {
            tool: toolName,
            args: context.lastAction.args ?? {},
          },
        ],
        stopCondition: 'after_tool_plan_complete',
      };
    }
  }

  const yieldPlan = planYieldTool(text, context);
  if (yieldPlan) {
    const isStaking = toolMatchesAction(yieldPlan.tool, SOLANA_LIQUID_STAKING_YIELDS_ACTION);
    return {
      agent: isStaking ? 'staking' : 'lending',
      mode: 'explore',
      ui: yieldPlan.ui,
      toolPlan: [
        {
          tool: yieldPlan.tool,
          args: yieldPlan.args,
        },
      ],
      stopCondition: yieldPlan.stop,
    };
  }

  return {
    agent: 'recommendation',
    mode: 'explore',
    ui: 'text',
    toolPlan: [],
    stopCondition: 'none',
  };
};

export async function getSolanaRouterDecision(args: {
  model: LanguageModelV1;
  lastUserText: string;
  context: SolanaRouterContext;
}): Promise<SolanaRouterDecision> {
  const { model, lastUserText: userText, context } = args;
  const fallback = getSolanaRouterFallbackDecision(userText, context);

  const trimmed = String(userText || '').trim();
  if (!trimmed) return fallback;

  const routerSystem: CoreMessage = {
    role: 'system',
    content: `Return one JSON object matching the schema exactly.

Schema:
{
  "agent": "lending|staking|trading|wallet|knowledge|recommendation",
  "mode": "explore|decide|execute",
  "ui": "cards|cards_then_text|text",
  "toolPlan": [{ "tool": string, "args": object }],
  "stopCondition": "when_first_yields_result_received|after_tool_plan_complete|none"
}

Rules:
- Pool questions ("all pools", "highest TVL", "highest yield", "out of these") must return ui="cards" or ui="cards_then_text" and include a yields tool in toolPlan.
- "All pools" => limit: 50. Default sortBy="apy" unless the user explicitly asks TVL/safety (use sortBy="tvl").
- "Highest TVL" => sortBy="tvl", still use limit: 50 if listing pools.
- "Try again"/retry resumes the most recent cancelled/failed action from context by reusing its tool + args.
- Keep toolPlan to a single tool unless resuming an action requires otherwise.`,
  };

  const routerUser: CoreMessage = {
    role: 'user',
    content: `User: ${trimmed}

Context: ${JSON.stringify(context)}`,
  };

  try {
    const { object } = await generateObject({
      model,
      schema: SolanaRouterDecisionSchema,
      messages: [routerSystem, routerUser],
    });

    if (object.toolPlan.length === 0 && fallback.toolPlan.length > 0) return fallback;
    return object as SolanaRouterDecision;
  } catch {
    return fallback;
  }
}
