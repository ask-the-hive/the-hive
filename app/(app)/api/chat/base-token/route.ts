import { NextRequest } from 'next/server';

import { streamText } from 'ai';
import { getAllTokenPageActions, tokenPageTools } from '@/ai';

import type { TokenChatData } from '@/types';
import { withErrorHandling } from '@/lib/api-error-handler';
import { getChatModelConfig } from '@/lib/chat-model';
import { truncateMessagesToMaxTokens } from '@/lib/truncate-messages';

const system = (tokenMetadata: TokenChatData) =>
  `You are a blockchain agent that helps users analyze the following token: ${tokenMetadata.name} (${tokenMetadata.symbol}) with the address ${tokenMetadata.address}.

The token is on the Base Chain.

You have access to various tools to analyze this token, including:
- Price analysis and charts
- Token holder information and distribution
- Trading activity and volume
- Liquidity analysis
- Social metrics (if available)

SCOPE (token analysis only):
- Do not help the user connect a wallet or execute transactions (swap/trade/buy/sell/stake/lend/withdraw/bridge).
- Do not provide yield recommendations or “best/safest/optimal” decisions for earning.
- If the user asks to trade or earn yield, tell them to use the main Hive chat (not this token page) for that workflow.

Please use these tools to provide detailed insights about the token when asked.`;

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    messages,
    modelName,
    token,
  }: { messages: any[]; modelName: string; token: TokenChatData } = await req.json();

  const { model, maxTokens } = getChatModelConfig(modelName);
  const truncatedMessages = truncateMessagesToMaxTokens(messages, maxTokens);

  // Get Base-specific actions and tools
  const actions = getAllTokenPageActions(token.extensions, 'base');
  const tools = tokenPageTools(token, actions);

  const streamTextResult = streamText({
    model,
    messages: truncatedMessages,
    system: system(token),
    tools,
  });

  return streamTextResult.toDataStreamResponse();
});
