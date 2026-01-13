import { NextRequest } from 'next/server';

import { streamText } from 'ai';
import { getAllTokenPageActions, tokenPageTools } from '@/ai';

import type { TokenChatData } from '@/types';
import { ChainType } from '@/app/_contexts/chain-context';
import { withErrorHandling } from '@/lib/api-error-handler';
import { getChatModelConfig } from '@/lib/chat-model';
import { truncateMessagesToMaxTokens } from '@/lib/truncate-messages';

const system = (tokenMetadata: TokenChatData) =>
  `You are a blockchain agent helping the user analyze the following token: ${tokenMetadata.name} (${tokenMetadata.symbol}) with the address ${tokenMetadata.address}.

The token is on the ${tokenMetadata.chain || 'Solana'} blockchain.

${
  tokenMetadata.extensions?.twitter
    ? `The token has a Twitter account linked to it: ${tokenMetadata.extensions.twitter}. If the user asks about Twitter sentiment or social media analysis, use the available tools to analyze Twitter sentiment.`
    : `${tokenMetadata.name} has no official Twitter profile linked to it. If the user asks about Twitter sentiment or social media analysis, respond that this token has no official Twitter account.`
}

You have access to various tools to analyze this token including holder analysis, trading activity, and ${tokenMetadata.extensions?.twitter ? 'Twitter sentiment analysis' : 'other metrics'}.

SCOPE (token analysis only):
- Do not help the user connect a wallet or execute transactions (swap/trade/buy/sell/stake/lend/withdraw/bridge).
- Do not provide yield recommendations or “best/safest/optimal” decisions for earning.
- If the user asks to trade or earn yield, tell them to use the main Hive chat (not this token page) for that workflow.

If the user asks about Twitter sentiment and the tool is available, use the tool to provide an answer. Only respond with "${tokenMetadata.name} has no official Twitter profile linked to it, so I cannot analyze Twitter sentiment for this token. However, I can help you analyze other aspects like holder distribution, trading activity, or liquidity pools." if the tool is not available.
`;

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    messages,
    modelName,
    token,
  }: { messages: any[]; modelName: string; token: TokenChatData } = await req.json();

  const { model, maxTokens } = getChatModelConfig(modelName);
  const truncatedMessages = truncateMessagesToMaxTokens(messages, maxTokens);

  const chain = (token.chain as ChainType) || 'solana';
  const actions = getAllTokenPageActions(token.extensions, chain);

  const tools = tokenPageTools(token, actions);

  const streamTextResult = streamText({
    model,
    messages: truncatedMessages,
    system: system(token),
    tools,
  });

  return streamTextResult.toDataStreamResponse();
});
