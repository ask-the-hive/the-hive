import { NextRequest } from 'next/server';

import { LanguageModelV1, streamText } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { Models } from '@/types/models';
import { getAllTokenPageActions, tokenPageTools } from '@/ai';

import type { TokenChatData } from '@/types';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';

const system = (tokenMetadata: TokenChatData) =>
  `You are a blockchain agent helping the user analyze the following token: ${tokenMetadata.name} (${tokenMetadata.symbol}) with the address ${tokenMetadata.address}.

The token is on the ${tokenMetadata.chain || 'Solana'} blockchain.

${
  tokenMetadata.extensions?.twitter
    ? `The token has a Twitter account linked to it: ${tokenMetadata.extensions.twitter}. If the user asks about Twitter sentiment or social media analysis, use the available tools to analyze Twitter sentiment.`
    : `${tokenMetadata.name} has no official Twitter profile linked to it. If the user asks about Twitter sentiment or social media analysis, respond that this token has no official Twitter account.`
}

You have access to various tools to analyze this token including holder analysis, trading activity, and ${tokenMetadata.extensions?.twitter ? 'Twitter sentiment analysis' : 'other metrics'}.

If the user asks about Twitter sentiment and the tool is available, use the tool to provide an answer. Only respond with "${tokenMetadata.name} has no official Twitter profile linked to it, so I cannot analyze Twitter sentiment for this token. However, I can help you analyze other aspects like holder distribution, trading activity, or liquidity pools." if the tool is not available.
`;

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    messages,
    modelName,
    token,
  }: { messages: any[]; modelName: string; token: TokenChatData } = await req.json();

  // Log the Twitter account being used for sentiment analysis
  console.log('[Chat API] Twitter account for sentiment:', token.extensions?.twitter);

  let MAX_TOKENS: number | undefined = undefined;
  let model: LanguageModelV1 | undefined = undefined;

  if (modelName === Models.OpenAI) {
    model = openai('gpt-4o-mini');
    MAX_TOKENS = 128000;
  }

  if (modelName === Models.Anthropic) {
    model = anthropic('claude-3-5-sonnet-latest');
    MAX_TOKENS = 190000;
  }

  if (modelName === Models.XAI) {
    model = xai('grok-beta');
    MAX_TOKENS = 131072;
  }

  if (modelName === Models.Gemini) {
    model = google('gemini-2.0-flash-exp');
    MAX_TOKENS = 1048576;
  }

  if (modelName === Models.Deepseek) {
    model = deepseek('deepseek-chat') as LanguageModelV1;
    MAX_TOKENS = 64000;
  }

  if (!model || !MAX_TOKENS) {
    throw new Error('Invalid model');
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

  const chain = (token.chain as ChainType) || 'solana';
  const actions = getAllTokenPageActions(token.extensions, chain);

  // Log the actions array to see if Twitter sentiment tool is present
  console.log(
    '[Chat API] actions:',
    actions.map((a) => a?.constructor?.name || typeof a),
  );

  const tools = tokenPageTools(token, actions);
  // Log the tools object keys to see what tools are available
  console.log('[Chat API] tools:', Object.keys(tools));

  const streamTextResult = streamText({
    model,
    messages: truncatedMessages,
    system: system(token),
    tools: tokenPageTools(token, actions),
  });

  return streamTextResult.toDataStreamResponse();
});
