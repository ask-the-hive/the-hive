import { NextRequest } from 'next/server';
import { CoreTool, Message, streamText, StreamTextResult } from 'ai';
import { chooseRoute } from './utils';
import { withErrorHandling } from '@/lib/api-error-handler';
import { gateToolsByMode } from '@/ai/routing/gate-tools';
import { logRoutingDecision } from '@/ai/routing/log-routing';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { getChatModelConfig } from '@/lib/chat-model';
import { truncateMessagesToMaxTokens } from '@/lib/truncate-messages';
import { sanitizeMessagesForStreamText } from '@/lib/sanitize-messages';

const system = `You are The Hive, a network of specialized blockchain agents on Base.

If the user’s request is too ambiguous for routing, respond with a short, helpful Base-focused message and ask for the missing detail (e.g., a token address, protocol name, or what they want to do).

Do not suggest trading unless the user explicitly asks to trade or swap.`;

export const POST = withErrorHandling(async (req: NextRequest) => {
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
    const allowWalletConnect =
      decision.mode === 'execute' || intent.domain === 'portfolio' || intent.needsWalletForPersonalization;
    const tools = gateToolsByMode(chosenAgent.tools, {
      mode: decision.mode,
      allowWalletConnect,
      hasWalletAddress: Boolean(walletAddress),
    });

    const decisionToolKey = Object.keys(tools).find((k) => k.endsWith(UI_DECISION_RESPONSE_NAME));
    const enforceDecisionOutput =
      decision.mode === 'decide' &&
      (intent.goal === 'decide' || intent.decisionStrength !== 'none') &&
      Boolean(decisionToolKey);

    streamTextResult = streamText({
      model,
      tools,
      messages: truncatedMessages,
      system: `${chosenAgent.systemPrompt}\n\nFLOW_MODE: ${decision.mode}\n\nUnless explicitly stated, you should not reiterate the output of the tool as it is shown in the user interface.`,
      ...(enforceDecisionOutput
        ? {
            maxSteps: 4,
            experimental_continueSteps: true,
            experimental_prepareStep: async ({
              steps,
              stepNumber,
              maxSteps,
            }: {
              steps: any[];
              stepNumber: number;
              maxSteps: number;
            }) => {
              const decisionKey = decisionToolKey as keyof typeof tools;
              const hasToolCall = (toolName: string) =>
                steps.some((s: any) =>
                  (s.toolCalls ?? []).some((c: any) => c.toolName === toolName),
                );
              if (hasToolCall(String(decisionKey))) return undefined;

              if (stepNumber > 1) {
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
            },
          }
        : {}),
    });

    logRoutingDecision({
      chain: 'base',
      agentName: chosenAgent.name,
      decision,
      intent,
      allowWalletConnect,
      hasWalletAddress: Boolean(walletAddress),
      tools: { before: Object.keys(chosenAgent.tools).length, after: Object.keys(tools).length },
    });
  }

  return streamTextResult.toDataStreamResponse();
});
