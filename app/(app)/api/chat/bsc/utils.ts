import { z } from "zod";

import { generateObject, LanguageModelV1, Message } from "ai";

import { bscTokenAnalysisAgent } from "@/ai/agents/bsc-token-analysis";
import { bscMarketAgent } from "@/ai/agents/bsc-market";
import { bscWalletAgent } from "@/ai/agents/bsc-wallet";
import { bscKnowledgeAgent } from "@/ai/agents/bsc-knowledge";
import { Agent } from "@/ai/agent";

// List of BSC-specific agents
const bscAgents = [
    bscTokenAnalysisAgent,
    bscMarketAgent,
    bscWalletAgent,
    bscKnowledgeAgent
];

export const system = 
`You are the orchestrator of a swarm of blockchain agents that each have specialized tasks on the Binance Smart Chain (BSC).

Given this list of agents and their capabilities, choose the one that is most appropriate for the user's request.

${bscAgents.map(agent => `${agent.name}: ${agent.systemPrompt}`).join("\n")}`

export const chooseAgent = async (model: LanguageModelV1, messages: Message[]): Promise<Agent | null> => {
    const { object } = await generateObject({
        model,
        schema: z.object({
            agent: z.enum(bscAgents.map(agent => agent.name) as [string, ...string[]])
        }),
        messages,
        system
    })

    return bscAgents.find(agent => agent.name === object.agent) ?? null;
} 