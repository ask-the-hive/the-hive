import { NextRequest } from 'next/server';

import { CoreTool, Message, streamText, StreamTextResult } from 'ai';
import { agents } from '@/ai/agents';
import { WALLET_AGENT_NAME } from '@/ai/agents/wallet/name';
import { RECOMMENDATION_AGENT_NAME } from '@/ai/agents/recommendation/name';
import { LENDING_AGENT_NAME } from '@/ai/agents/lending/name';
import { STAKING_AGENT_NAME } from '@/ai/agents/staking/name';
import { KNOWLEDGE_AGENT_NAME } from '@/ai/agents/knowledge/name';
import { TRADING_AGENT_NAME } from '@/ai/agents/trading/name';
import { chooseRoute } from './utils';
import { gateToolsByMode } from '@/ai/routing/gate-tools';
import { logRoutingDecision } from '@/ai/routing/log-routing';
import { buildSolanaRouterInput, getSolanaRouterDecision } from '@/ai/routing/solana-router';
import { getNextRouterPlanItem } from '@/ai/routing/router-plan';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import {
  SOLANA_ALL_BALANCES_NAME,
  SOLANA_GET_WALLET_ADDRESS_ACTION,
  SOLANA_LEND_ACTION,
  SOLANA_LENDING_YIELDS_ACTION,
  SOLANA_LIQUID_STAKING_YIELDS_ACTION,
  SOLANA_STAKE_ACTION,
  SOLANA_TRADE_ACTION,
  SOLANA_TRANSFER_NAME,
  SOLANA_UNSTAKE_ACTION,
  SOLANA_WITHDRAW_ACTION,
} from '@/ai/action-names';
import { getChatModelConfig } from '@/lib/chat-model';
import { truncateMessagesToMaxTokens } from '@/lib/truncate-messages';
import { sanitizeMessagesForStreamText } from '@/lib/sanitize-messages';

const system = `You are The Hive, a network of specialized blockchain agents on Solana.

If the user’s request is too ambiguous for routing, keep the response short and safe:
- Default to helping them earn yield via staking (SOL) or stablecoin lending (USDC/USDT/etc).
- Do not suggest trading or “trending tokens” unless the user explicitly asks to trade.
- Do not mention or recommend any specific token unless the user asked about it.`;

const LOOP_GUARD_MESSAGE = 'Tool call blocked to prevent repeating the same request in a single turn.';

const stableSerialize = (value: unknown): string => {
  const normalize = (input: any): any => {
    if (!input || typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map(normalize);
    const entries = Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalize(val)]);
    return Object.fromEntries(entries);
  };

  try {
    return JSON.stringify(normalize(value));
  } catch {
    return '';
  }
};

const withToolCallLoopGuard = (
  tools: Record<string, CoreTool<any, any>>,
  options?: {
    argsTransformers?: Record<string, (args: unknown) => unknown>;
    dedupeToolKeys?: Set<string> | string[];
    dedupeKeyByTool?: (toolName: string) => string | null;
  },
) => {
  const seen = new Set<string>();
  const dedupeToolKeys = options?.dedupeToolKeys
    ? new Set(options.dedupeToolKeys)
    : null;
  const dedupeKeyByTool = options?.dedupeKeyByTool;
  const wrapped: Record<string, CoreTool<any, any>> = {};

  for (const [toolName, tool] of Object.entries(tools)) {
    const execute = (tool as any)?.execute;
    if (typeof execute !== 'function') {
      wrapped[toolName] = tool;
      continue;
    }

    const originalExecute = execute.bind(tool);
    const transformArgs = options?.argsTransformers?.[toolName];
    wrapped[toolName] = {
      ...tool,
      execute: async (args: unknown, ...rest: unknown[]) => {
        const effectiveArgs = transformArgs ? transformArgs(args) : args;
        const dedupeGroup = dedupeKeyByTool?.(toolName);
        const signature = dedupeGroup
          ? `dedupe:${dedupeGroup}:${stableSerialize(effectiveArgs)}`
          : dedupeToolKeys?.has(toolName)
            ? `dedupe:${toolName}`
            : `${toolName}:${stableSerialize(effectiveArgs)}`;
        if (seen.has(signature)) {
          if (process.env.ROUTING_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.info('[routing]', {
              guard: 'duplicate_tool_call',
              toolName,
              args: effectiveArgs,
            });
          }
          return { message: LOOP_GUARD_MESSAGE };
        }
        seen.add(signature);
        return originalExecute(effectiveArgs, ...rest);
      },
    } as CoreTool<any, any>;
  }

  return wrapped;
};

const ROUTER_AGENT_NAME_MAP: Record<string, string> = {
  lending: LENDING_AGENT_NAME,
  staking: STAKING_AGENT_NAME,
  trading: TRADING_AGENT_NAME,
  wallet: WALLET_AGENT_NAME,
  knowledge: KNOWLEDGE_AGENT_NAME,
  recommendation: RECOMMENDATION_AGENT_NAME,
};

const normalizeToolName = (toolName: string) =>
  toolName
    .toLowerCase()
    .split('-')
    .join('_');

const isExecutionToolName = (toolName: string) => {
  const normalized = normalizeToolName(toolName);
  return (
    normalized.includes(SOLANA_LEND_ACTION) ||
    normalized.includes(SOLANA_WITHDRAW_ACTION) ||
    normalized.includes(SOLANA_STAKE_ACTION) ||
    normalized.includes(SOLANA_UNSTAKE_ACTION) ||
    normalized.includes(SOLANA_TRADE_ACTION) ||
    normalized.includes(SOLANA_TRANSFER_NAME)
  );
};

const isYieldToolName = (toolName: string) => {
  const normalized = normalizeToolName(toolName);
  return (
    normalized.includes(SOLANA_LENDING_YIELDS_ACTION) ||
    normalized.includes(SOLANA_LIQUID_STAKING_YIELDS_ACTION)
  );
};

const resolveToolKey = (tools: Record<string, CoreTool<any, any>>, toolName: string) => {
  const direct = tools[toolName];
  if (direct) return toolName;
  return Object.keys(tools).find((key) => key.endsWith(toolName));
};

export const POST = async (req: NextRequest) => {
  const {
    messages,
    modelName,
    walletAddress,
  }: { messages: Message[]; modelName: string; walletAddress?: string } = await req.json();

  const { model, maxTokens } = getChatModelConfig(modelName);
  const truncatedMessages = sanitizeMessagesForStreamText(
    truncateMessagesToMaxTokens(messages, maxTokens),
  );

  const { agent: chosenAgent, intent, decision } = await chooseRoute(model, truncatedMessages);

  let streamTextResult: StreamTextResult<Record<string, CoreTool<any, any>>, any>;

  if (!chosenAgent) {
    streamTextResult = streamText({
      model,
      messages: truncatedMessages,
      system,
    });
  } else {
    const routerInput = buildSolanaRouterInput(truncatedMessages);
    const routerEnabled = process.env.SOLANA_ROUTER_CONTRACT !== 'false';
    const routerEligible =
      chosenAgent.name === LENDING_AGENT_NAME ||
      chosenAgent.name === STAKING_AGENT_NAME ||
      chosenAgent.name === RECOMMENDATION_AGENT_NAME;
    const routerDecision = routerEnabled && routerEligible
      ? await getSolanaRouterDecision({
          model,
          lastUserText: routerInput.lastUserText,
          context: routerInput.context,
        })
      : null;
    const routerAgentName = routerDecision
      ? ROUTER_AGENT_NAME_MAP[routerDecision.agent]
      : undefined;
    const routerAgent = routerAgentName
      ? agents.find((agent) => agent.name === routerAgentName) ?? null
      : null;
    const routerHasToolPlan = Boolean(routerDecision?.toolPlan?.length);
    const flowMode = routerHasToolPlan ? routerDecision!.mode : decision.mode;
    const effectiveDecision =
      flowMode === decision.mode ? decision : { ...decision, mode: flowMode };

    const activeAgent = routerAgent ?? chosenAgent;
    let agentSystem = activeAgent.systemPrompt;

    const allowWalletConnect =
      flowMode === 'execute' || intent.domain === 'portfolio' || intent.needsWalletForPersonalization;
    const gatedTools = gateToolsByMode(activeAgent.tools, {
      mode: flowMode,
      allowWalletConnect,
      hasWalletAddress: Boolean(walletAddress),
    });
    const routerToolPlan = routerDecision?.toolPlan ?? [];
    const routerResolvedPlan = routerToolPlan
      .map((item) => ({
        ...item,
        toolKey: resolveToolKey(gatedTools, item.tool),
      }))
      .filter((item) => item.toolKey);
    const routerToolPlanItem = routerResolvedPlan[0];
    const routerToolKey = routerToolPlanItem?.toolKey;
    const routerArgsQueue: Record<string, Record<string, unknown>[]> = {};
    for (const item of routerResolvedPlan) {
      if (!item.toolKey || !item.args) continue;
      if (!routerArgsQueue[item.toolKey]) routerArgsQueue[item.toolKey] = [];
      routerArgsQueue[item.toolKey].push(item.args as Record<string, unknown>);
    }
    const routerArgsTransformers =
      Object.keys(routerArgsQueue).length > 0
        ? Object.fromEntries(
            Object.entries(routerArgsQueue).map(([toolKey, argsList]) => [
              toolKey,
              (args: unknown) => {
                const nextArgs = argsList[0];
                if (!nextArgs) return args;
                argsList.shift();
                return {
                  ...(args && typeof args === 'object' ? (args as Record<string, unknown>) : {}),
                  ...nextArgs,
                };
              },
            ]),
          )
        : undefined;
    const tools = withToolCallLoopGuard(gatedTools, {
      argsTransformers: routerArgsTransformers,
      dedupeKeyByTool: (toolName: string) => {
        if (toolName.endsWith(SOLANA_LENDING_YIELDS_ACTION)) {
          return SOLANA_LENDING_YIELDS_ACTION;
        }
        if (toolName.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION)) {
          return SOLANA_LIQUID_STAKING_YIELDS_ACTION;
        }
        return null;
      },
    });

    const decisionToolKey = Object.keys(tools).find((k) => k.endsWith(UI_DECISION_RESPONSE_NAME));
    const enforceDecisionOutput =
      flowMode === 'decide' &&
      (intent.goal === 'decide' || intent.decisionStrength !== 'none') &&
      Boolean(decisionToolKey);
    const enforceAssetAware =
      enforceDecisionOutput &&
      activeAgent.name === RECOMMENDATION_AGENT_NAME &&
      intent.domain === 'yield' &&
      (Boolean(walletAddress) || intent.needsWalletForPersonalization);
    const enforceWalletForPersonalization =
      enforceAssetAware && !walletAddress && intent.needsWalletForPersonalization;
    const enforceGlobalYieldComparison =
      enforceDecisionOutput &&
      activeAgent.name === RECOMMENDATION_AGENT_NAME &&
      (intent.domain === 'yield' || intent.domain === 'lending' || intent.domain === 'staking') &&
      (intent.assetScope === 'unknown' || intent.assetScope === 'both') &&
      intent.objective !== 'safest' &&
      !intent.needsWalletForPersonalization &&
      !walletAddress;
    const enforceWalletForSafestUnknown =
      enforceDecisionOutput &&
      activeAgent.name === RECOMMENDATION_AGENT_NAME &&
      intent.needsWalletForPersonalization &&
      (intent.domain === 'yield' || intent.domain === 'lending' || intent.domain === 'staking') &&
      intent.objective === 'safest' &&
      intent.assetScope === 'unknown' &&
      !walletAddress;

    if (activeAgent.name === RECOMMENDATION_AGENT_NAME) {
      agentSystem = `${agentSystem}

WALLET_ADDRESS: ${walletAddress || ''}
FLOW_MODE: ${flowMode}
`;
    } else {
      agentSystem = `${agentSystem}

FLOW_MODE: ${flowMode}
`;
    }

    const includesYieldsTools = Object.keys(tools).some(
      (k) =>
        k.endsWith(SOLANA_LENDING_YIELDS_ACTION) || k.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION),
    );
    const routerStopsOnYield =
      routerDecision?.stopCondition === 'when_first_yields_result_received';
    const allowYieldSummaryFollowup =
      flowMode !== 'execute' &&
      !enforceDecisionOutput &&
      includesYieldsTools &&
      !routerStopsOnYield;

    const lendingYieldsKey = Object.keys(tools).find((k) =>
      k.endsWith(SOLANA_LENDING_YIELDS_ACTION),
    ) as keyof typeof tools | undefined;
    const stakingYieldsKey = Object.keys(tools).find((k) =>
      k.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION),
    ) as keyof typeof tools | undefined;

    const lastUserText = routerInput.lastUserText;

    const shouldForceYieldCards = (() => {
      if (flowMode === 'execute') return false;
      if (!includesYieldsTools) return false;
      const text = lastUserText.toLowerCase();
      if (!text) return false;
      const asksWhich = /(\bwhich\b|\bwhat\b|\bbest\b|\bhighest\b|\bmost\b|\btop\b)/.test(text);
      const aboutYield = /(\bapy\b|\byield\b|\bapr\b)/.test(text);
      const aboutTvl = /\btvl\b/.test(text) || text.includes('total value locked');
      const referencesPools = /(\bpool\b|\bpools\b|\boptions\b|\bof these\b|\bamong\b)/.test(text);
      const asksAll = /\ball\b/.test(text) && referencesPools;
      return (referencesPools && asksWhich && (aboutYield || aboutTvl)) || asksAll;
    })();

    const requiredYieldKey: keyof typeof tools | undefined = (() => {
      if (activeAgent.name === LENDING_AGENT_NAME) return lendingYieldsKey;
      if (activeAgent.name === STAKING_AGENT_NAME) return stakingYieldsKey;
      if (intent.domain === 'staking' || intent.assetScope === 'sol') return stakingYieldsKey;
      if (intent.domain === 'lending' || intent.assetScope === 'stablecoins') return lendingYieldsKey;
      return lendingYieldsKey ?? stakingYieldsKey;
    })();

    const forceYieldToolEnabled = process.env.FORCE_YIELD_TOOL_FIRST !== 'false';
    const routerToolIsExecution = routerToolPlanItem
      ? isExecutionToolName(routerToolPlanItem.tool)
      : false;
    const routerToolIsYield = routerToolPlanItem ? isYieldToolName(routerToolPlanItem.tool) : false;

    const forcedToolKey =
      routerToolKey ?? (forceYieldToolEnabled && shouldForceYieldCards ? requiredYieldKey : undefined);
    const forcedToolIsYield =
      routerToolKey ? routerToolIsYield : Boolean(shouldForceYieldCards && requiredYieldKey);

    if (includesYieldsTools) {
      const text = lastUserText.toLowerCase();
      const asksAll = /\ball\b/.test(text) && /(\bpool\b|\bpools\b|\boptions\b)/.test(text);
      const aboutTvl = /\btvl\b/.test(text) || text.includes('total value locked');
      agentSystem = `${agentSystem}

YIELDS TOOL ARGUMENTS (IMPORTANT):
- When listing pools/options/cards (e.g., "all pools"), call the yields tool with \`limit: 50\`.
- Default to APY sorting (omit \`sortBy\` or use \`sortBy: "apy"\`) unless the user explicitly asks about TVL/safety.
- If the user asks about highest TVL / safest, set \`sortBy: "tvl"\` (still use \`limit: 50\` when listing all).
${asksAll ? '- The user asked to list all pools: use `limit: 50`.' : ''}${
        asksAll && aboutTvl ? '\n- The user asked about TVL: use `sortBy: "tvl"`.' : ''
      }`;
    }

    if (routerDecision?.toolPlan?.length) {
      agentSystem = `${agentSystem}

ROUTER TOOL PLAN (REQUIRED):
${JSON.stringify(routerDecision.toolPlan)}
ROUTER UI: ${routerDecision.ui}
ROUTER STOP: ${routerDecision.stopCondition}
`;
    }

    if (activeAgent.name === WALLET_AGENT_NAME) {
      agentSystem = `${agentSystem}

GLOBAL TOOL RESULT RULES:
- Do not restate or enumerate raw tool outputs that the UI already renders (such as detailed balance lists).
- For wallet balance tools, especially the "get all balances" action, follow your balance-display rules exactly and avoid bullet lists of individual token balances.
`;
    } else {
      agentSystem = `${agentSystem}

CRITICAL - Tool Result Status-Based Communication:
- After invoking a tool, check the result's 'status' field to determine what to say
- The status field indicates the current state of the operation

Status-based responses:
1. **status === 'pending'**: Tool is awaiting user confirmation in the UI
   - Provide educational context about what they're doing
   - Explain how it works and what to expect
   - Guide them through the next steps
   - Example: "Great! I'm showing you the lending interface. **What you're doing:** You're lending USDT at the live rate shown in the card..."

2. **status === 'complete'**: Transaction succeeded
   - Provide a success message confirming what was accomplished
   - Explain what they can do next
   - Example: "You're all set — your USDT is now lent! You can track the live rate and earnings in your position..."

3. **status === 'cancelled'**: User cancelled the transaction
   - Acknowledge neutrally without making them feel bad
   - Example: "No problem! Let me know if you'd like to try again or if you have any questions."

4. **status === 'failed'**: Transaction failed
   - Acknowledge the failure
   - Offer help or suggest troubleshooting

IMPORTANT: Check the status field in tool results to provide contextually appropriate responses. Do NOT provide success messages when status is 'pending'.

ACTION CTA RULE:
- If you provide a recommendation, end your message with exactly one concrete CTA line (e.g., "Connect wallet", "View safest pool", "Stake now", "Lend now").
`;
    }

    if (allowYieldSummaryFollowup) {
      agentSystem = `${agentSystem}

YIELD SUMMARY RULE (REQUIRED):
- After you call a yields tool and receive results, write a short summary of the top pool.
- Include the exact APY percentage (2 decimals) and the exact TVL in USD (use the raw number, formatted with commas).
- Do NOT add a heading like "Lend USDS" or "Stake SOL".
- Keep it to 1–2 sentences, then exactly one CTA line (e.g., "Click “Lend now” on the pool you want.").`;
    }

    const forcedToolFromRouter = Boolean(routerToolKey);
    const forcedToolConfig = (() => {
      if (forcedToolKey) {
        const toolKey = forcedToolKey as keyof typeof tools;
        if (!forcedToolFromRouter) {
          return {
            toolChoice: { type: 'tool', toolName: toolKey },
            experimental_activeTools: [toolKey],
            maxSteps: 2,
            experimental_continueSteps: true,
          };
        }

        const stopCondition = routerDecision?.stopCondition;
        const shouldStopEarly =
          stopCondition === 'when_first_yields_result_received' ||
          (routerToolIsExecution && routerToolPlan.length <= 1);
        const maxSteps = shouldStopEarly ? 1 : 2;
        return {
          toolChoice: { type: 'tool', toolName: toolKey },
          experimental_activeTools: [toolKey],
          maxSteps,
          ...(maxSteps > 1
            ? { experimental_continueSteps: true }
            : { experimental_continueSteps: false }),
        };
      }

      if (allowYieldSummaryFollowup) {
        return { maxSteps: 2, experimental_continueSteps: true };
      }

      return {};
    })();
    const routerBudgetConfig =
      routerDecision && !enforceDecisionOutput
        ? {
            maxSteps:
              flowMode === 'execute'
                ? 3
                : flowMode === 'decide'
                  ? 3
                  : 2,
            experimental_continueSteps: true,
          }
        : {};

    const prepareStep = async ({
      steps,
      stepNumber,
      maxSteps,
    }: {
      steps: any[];
      stepNumber: number;
      maxSteps: number;
    }) => {
      const hasToolCall = (toolName: string) =>
        steps.some((s: any) =>
          (s.toolCalls ?? []).some((c: any) => c.toolName === toolName),
        );
      const hasToolResult = (toolName: string) =>
        steps.some((s: any) =>
          (s.toolResults ?? []).some((r: any) => String(r.toolName ?? '') === toolName),
        );

      if (routerResolvedPlan.length > 0) {
        const nextPlanItem = getNextRouterPlanItem(routerResolvedPlan, steps);
        if (nextPlanItem?.toolKey) {
          const toolKey = String(nextPlanItem.toolKey);
          if (!hasToolCall(toolKey)) {
            return {
              toolChoice: { type: 'tool', toolName: toolKey },
              experimental_activeTools: [toolKey],
            };
          }
          return { experimental_activeTools: [toolKey] };
        }
      }

      if (!enforceDecisionOutput) return undefined;

      const decisionKey = decisionToolKey as keyof typeof tools;
      const connectKey = Object.keys(tools).find((k) =>
        k.endsWith(SOLANA_GET_WALLET_ADDRESS_ACTION),
      ) as keyof typeof tools | undefined;
      const balancesKey = Object.keys(tools).find((k) =>
        k.endsWith(SOLANA_ALL_BALANCES_NAME),
      ) as keyof typeof tools | undefined;
      const stakingKey = Object.keys(tools).find((k) =>
        k.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION),
      ) as keyof typeof tools | undefined;
      const lendingKey = Object.keys(tools).find((k) =>
        k.endsWith(SOLANA_LENDING_YIELDS_ACTION),
      ) as keyof typeof tools | undefined;

      const hasYieldData =
        steps.some((s: any) =>
          (s.toolResults ?? []).some((r: any) => {
            const name = String(r.toolName ?? '');
            return (
              name.endsWith(SOLANA_LENDING_YIELDS_ACTION) ||
              name.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION)
            );
          }),
        ) || false;

      if (enforceWalletForPersonalization) {
        if (connectKey && !hasToolResult(String(connectKey))) {
          return {
            toolChoice: { type: 'tool', toolName: connectKey },
            experimental_activeTools: [connectKey],
          };
        }

        if (balancesKey && !hasToolResult(String(balancesKey))) {
          return {
            toolChoice: { type: 'tool', toolName: balancesKey },
            experimental_activeTools: [balancesKey],
          };
        }

        // After wallet + balances, require yield data before allowing the decision tool.
        if (!hasYieldData) {
          const active = [stakingKey, lendingKey].filter(Boolean) as (keyof typeof tools)[];
          if (active.length) return { experimental_activeTools: active };
        }

        if (!hasToolCall(String(decisionKey)) && hasYieldData) {
          return {
            toolChoice: { type: 'tool', toolName: decisionKey },
            experimental_activeTools: [decisionKey],
          };
        }

        return undefined;
      }

      if (enforceWalletForSafestUnknown) {
        if (connectKey && !hasToolResult(String(connectKey))) {
          return {
            toolChoice: { type: 'tool', toolName: connectKey },
            experimental_activeTools: [connectKey],
          };
        }

        if (balancesKey && !hasToolResult(String(balancesKey))) {
          return {
            toolChoice: { type: 'tool', toolName: balancesKey },
            experimental_activeTools: [balancesKey],
          };
        }

        if (!hasYieldData) {
          const active = [stakingKey, lendingKey].filter(Boolean) as (keyof typeof tools)[];
          if (active.length) return { experimental_activeTools: active };
        }

        if (!hasToolCall(String(decisionKey)) && hasYieldData) {
          return {
            toolChoice: { type: 'tool', toolName: decisionKey },
            experimental_activeTools: [decisionKey],
          };
        }

        return undefined;
      }

      if (enforceGlobalYieldComparison) {
        if (stakingKey && !hasToolResult(String(stakingKey))) {
          return {
            toolChoice: { type: 'tool', toolName: stakingKey },
            experimental_activeTools: [stakingKey],
          };
        }

        if (lendingKey && !hasToolResult(String(lendingKey))) {
          return {
            toolChoice: { type: 'tool', toolName: lendingKey },
            experimental_activeTools: [lendingKey],
          };
        }

        if (!hasToolCall(String(decisionKey))) {
          return {
            toolChoice: { type: 'tool', toolName: decisionKey },
            experimental_activeTools: [decisionKey],
          };
        }

        return undefined;
      }

      if (enforceAssetAware && walletAddress) {
        if (balancesKey && !hasToolResult(String(balancesKey))) {
          return {
            toolChoice: { type: 'tool', toolName: balancesKey },
            experimental_activeTools: [balancesKey],
          };
        }
      }

      const requiredYieldKey =
        activeAgent.name === LENDING_AGENT_NAME
          ? (Object.keys(tools).find((k) => k.endsWith(SOLANA_LENDING_YIELDS_ACTION)) as
              | keyof typeof tools
              | undefined)
          : activeAgent.name === STAKING_AGENT_NAME
            ? (Object.keys(tools).find((k) => k.endsWith(SOLANA_LIQUID_STAKING_YIELDS_ACTION)) as
                | keyof typeof tools
                | undefined)
            : undefined;

      if (requiredYieldKey && !hasToolResult(String(requiredYieldKey))) {
        return {
          toolChoice: { type: 'tool', toolName: requiredYieldKey },
          experimental_activeTools: [requiredYieldKey],
        };
      }

      if (
        walletAddress &&
        activeAgent.name === RECOMMENDATION_AGENT_NAME &&
        (intent.assetScope === 'unknown' || intent.assetScope === 'both') &&
        intent.objective !== 'safest' &&
        (intent.domain === 'yield' || intent.domain === 'lending' || intent.domain === 'staking') &&
        stakingKey &&
        lendingKey
      ) {
        if (!hasToolResult(String(stakingKey))) {
          return {
            toolChoice: { type: 'tool', toolName: stakingKey },
            experimental_activeTools: [stakingKey],
          };
        }
        if (!hasToolResult(String(lendingKey))) {
          return {
            toolChoice: { type: 'tool', toolName: lendingKey },
            experimental_activeTools: [lendingKey],
          };
        }
      }

      if (!hasYieldData) {
        const activeYieldTools =
          activeAgent.name === RECOMMENDATION_AGENT_NAME
            ? ([stakingKey, lendingKey].filter(Boolean) as (keyof typeof tools)[])
            : requiredYieldKey
              ? ([requiredYieldKey] as (keyof typeof tools)[])
              : [];
        if (activeYieldTools.length) {
          return { experimental_activeTools: activeYieldTools };
        }
      }

      if (hasToolCall(String(decisionKey))) return undefined;

      if (stepNumber > 1 && hasYieldData) {
        return {
          toolChoice: { type: 'tool', toolName: decisionKey },
          experimental_activeTools: [decisionKey],
        };
      }

      if (stepNumber === maxSteps) {
        return {
          toolChoice: { type: 'tool', toolName: decisionKey },
          experimental_activeTools: [decisionKey],
        };
      }

      return undefined;
    };

    streamTextResult = streamText({
      model,
      tools,
      messages: truncatedMessages,
      system: agentSystem,
      ...routerBudgetConfig,
      ...forcedToolConfig,
      ...(flowMode === 'execute' && !routerDecision
        ? {
            maxSteps: 1,
          }
        : {}),
      ...(enforceDecisionOutput
        ? {
            maxSteps: !walletAddress && allowWalletConnect ? 5 : 4,
            experimental_continueSteps: true,
          }
        : {}),
      ...(routerResolvedPlan.length > 0 || enforceDecisionOutput
        ? { experimental_prepareStep: prepareStep }
        : {}),
    });

    logRoutingDecision({
      chain: 'solana',
      agentName: activeAgent.name,
      decision: effectiveDecision,
      intent,
      allowWalletConnect,
      hasWalletAddress: Boolean(walletAddress),
      tools: { before: Object.keys(activeAgent.tools).length, after: Object.keys(gatedTools).length },
      toolPlan: {
        routerEnabled,
        routerDecision: routerDecision ?? null,
        routerToolKey: routerToolKey ?? null,
        routerToolKeys: routerResolvedPlan.map((item) => item.toolKey),
        routerBudgetMaxSteps: (routerBudgetConfig as any)?.maxSteps ?? null,
        forcedToolKey: forcedToolKey ?? null,
        forcedToolIsYield,
        shouldForceYieldCards,
        forceYieldToolEnabled,
        requiredYieldKey: requiredYieldKey ?? null,
        decisionToolKey: decisionToolKey ?? null,
        allowYieldSummaryFollowup,
        enforceDecisionOutput,
      },
    });
  }

  return streamTextResult.toDataStreamResponse();
};
