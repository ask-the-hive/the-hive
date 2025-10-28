import { z } from 'zod';

import { generateObject, LanguageModelV1, Message } from 'ai';

import { agents } from '@/ai/agents';
import { Agent } from '@/ai/agent';

export const system = `You are the orchestrator of a swarm of blockchain agents that each have specialized tasks.

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

IMPORTANT: Pay special attention to these key distinctions:
- For SOL staking, unstaking, liquid staking pools, or staking yields: Choose "Staking Agent"
- For stablecoin lending, lending pools, lending yields, or lending operations: Choose "Lending Agent"
- For token transfers, wallet balances, or wallet operations: Choose "Wallet Agent"
- For trading, swapping, or buying tokens: Choose "Trading Agent"

${agents.map((agent) => `${agent.name}: ${agent.capabilities}`).join('\n')}`;

export const chooseAgent = async (
  model: LanguageModelV1,
  messages: Message[],
): Promise<Agent | null> => {
  const { object } = await generateObject({
    model,
    schema: z.object({
      agent: z.enum(agents.map((agent) => agent.name) as [string, ...string[]]),
    }),
    messages,
    system,
  });

  return agents.find((agent) => agent.name === object.agent) ?? null;
};
