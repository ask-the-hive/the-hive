import { NextRequest } from "next/server";

import { LanguageModelV1, streamText } from "ai";

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { Models } from "@/types/models";
import { 
    getAllTokenPageActions,
    tokenPageTools 
} from "@/ai";

import type { TokenChatData } from "@/types";

const system = (tokenMetadata: TokenChatData) =>
`You are a blockchain agent that helps users analyze the following token: ${tokenMetadata.name} (${tokenMetadata.symbol}) with the address ${tokenMetadata.address}.

The token is on the Binance Smart Chain (BSC).

You have access to various tools to analyze this token, including:
- Price analysis and charts
- Token holder information and distribution
- Trading activity and volume
- Liquidity analysis
- Social metrics (if available)

Please use these tools to provide detailed insights about the token when asked.`

export const POST = async (req: NextRequest) => {
    const { messages, modelName, token }: { messages: any[], modelName: string, token: TokenChatData } = await req.json();

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

    // Get BSC-specific actions and tools
    const actions = getAllTokenPageActions(token.extensions, 'bsc');
    const tools = tokenPageTools(token, actions);

    const streamTextResult = streamText({
        model,
        messages: truncatedMessages,
        system: system(token),
        tools
    });

    return streamTextResult.toDataStreamResponse();
} 