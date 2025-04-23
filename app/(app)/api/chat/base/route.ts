import { NextRequest } from "next/server";

import { CoreTool, LanguageModelV1, streamText, StreamTextResult } from "ai";

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { Models } from "@/types/models";
import { chooseAgent } from "./utils";
import { baseTokenAnalysisAgent } from "@/ai/agents/base-token-analysis";
import { baseKnowledgeAgent } from "@/ai/agents/base-knowledge";
import { baseWalletAgent } from "@/ai/agents/base-wallet";
import { baseMarketAgent } from "@/ai/agents/base-market";
import { baseLiquidityAgent } from "@/ai/agents/base-liquidity";
import { baseTradingAgent } from "@/ai/agents/base-trading";

// List of Base-specific agents
const baseAgents = [
    baseKnowledgeAgent,
    baseTokenAnalysisAgent,
    baseWalletAgent,
    baseMarketAgent,
    baseLiquidityAgent,
    baseTradingAgent
];

const system = 
`You a network of blockchain agents called The Hive (or Hive for short). You have access to a swarm of specialized agents with given tools and tasks for the Base Chain.

Your native ticker is BUZZ with a contract address of 9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump. BUZZ is strictly a memecoin and has no utility.

Here are the other agents:

${baseAgents.map(agent => `${agent.name}: ${agent.capabilities}`).join("\n")}

The query of the user did not result in any agent being invoked. You should respond with a message that is helpful to the user, focusing on Base-related information.`

export const POST = async (req: NextRequest) => {
    const { messages, modelName } = await req.json();

    let MAX_TOKENS: number | undefined = undefined;
    let model: LanguageModelV1 | undefined = undefined;

    if (modelName === Models.OpenAI) {
        model = openai("gpt-4o-mini");
        MAX_TOKENS = 128000;
    }

    if (modelName === Models.Anthropic) {
        model = anthropic("claude-3-5-sonnet-latest");
        MAX_TOKENS = 190000;
    }

    if (modelName === Models.XAI) {
        model = xai("grok-beta");
        MAX_TOKENS = 131072;
    }

    if (modelName === Models.Gemini) {
        model = google("gemini-2.0-flash-exp");
        MAX_TOKENS = 1048576;
    }

    if (modelName === Models.Deepseek) {
        model = deepseek("deepseek-chat") as LanguageModelV1;
        MAX_TOKENS = 64000;
    }

    if (!model || !MAX_TOKENS) {
        throw new Error("Invalid model");
    }

    // Add message token limit check
    let tokenCount = 0;
    const truncatedMessages = [];
    
    // Process messages from newest to oldest
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        // Rough token estimation: 4 chars ≈ 1 token
        const estimatedTokens = Math.ceil((msg.content?.length || 0) / 4);
        
        if (tokenCount + estimatedTokens <= MAX_TOKENS) {
            truncatedMessages.unshift(msg);
            tokenCount += estimatedTokens;
        } else {
            break;
        }
    }

    const chosenAgent = await chooseAgent(model, truncatedMessages);

    let streamTextResult: StreamTextResult<Record<string, CoreTool<any, any>>, any>;

    if(!chosenAgent) {
        streamTextResult = streamText({
            model,
            messages: truncatedMessages,
            system,
        });
    } else {
        streamTextResult = streamText({
            model,
            tools: chosenAgent.tools,
            messages: truncatedMessages,
            system: `${chosenAgent.systemPrompt}\n\nUnless explicitly stated, you should not reiterate the output of the tool as it is shown in the user interface. BUZZ, the native token of The Hive, is strictly a memecoin and has no utility.`,
        });
    }

    return streamTextResult.toDataStreamResponse();
} 