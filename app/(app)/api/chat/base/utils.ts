import { z } from "zod";

import { generateObject, LanguageModelV1, Message } from "ai";

import { Agent } from "@/ai/agent";
import { baseKnowledgeAgent } from "@/ai/agents/base-knowledge";
import { baseTokenAnalysisAgent } from "@/ai/agents/base-token-analysis";
import { baseWalletAgent } from "@/ai/agents/base-wallet";

// List of Base-specific agents
export const baseAgents: Agent[] = [
    baseKnowledgeAgent,
    baseTokenAnalysisAgent,
    baseWalletAgent
];

export const system = 
`You are the orchestrator of a swarm of blockchain agents that each have specialized tasks on the Base Chain.

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

${baseAgents.map(agent => `${agent.name}: ${agent.systemPrompt}`).join("\n")}`

export const chooseAgent = async (model: LanguageModelV1, messages: Message[]): Promise<Agent | null> => {
    const { object } = await generateObject({
        model,
        schema: z.object({
            agent: z.enum(baseAgents.map(agent => agent.name) as [string, ...string[]])
        }),
        messages,
        system
    })

    return baseAgents.find(agent => agent.name === object.agent) ?? null;
} 