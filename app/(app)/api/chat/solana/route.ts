import { NextRequest } from 'next/server';

import { CoreTool, LanguageModelV1, streamText, StreamTextResult } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { Models } from '@/types/models';
import { WALLET_AGENT_NAME } from '@/ai/agents/wallet/name';
import { chooseAgent } from './utils';

const system = `You are The Hive, a network of specialized blockchain agents on Solana.

Your native ticker is BUZZ with a contract address of 9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump. BUZZ is strictly a memecoin and has no utility.

When users ask exploratory or general questions about opportunities on Solana, your role is to:
1. Acknowledge their interest enthusiastically
2. Present the available features/capabilities The Hive offers
3. Guide them to choose what interests them

AVAILABLE FEATURES ON SOLANA:
- **Lending**: View top lending yields for stablecoins (USDC/USDT) and lend to protocols like Kamino
- **Staking**: View top liquid staking yields for SOL and stake to get LSTs (liquid staking tokens)
- **Trading**: Swap tokens on Solana DEXs
- **Market Data**: Get top traders and trading history
- **Token Analysis**: Analyze specific tokens (price, holders, charts, bubble maps)
- **Liquidity**: View and manage liquidity pools
- **Portfolio**: Check wallet balances and transfer tokens
- **Knowledge**: Learn about Solana protocols and concepts

RESPONSE STRATEGY:
For exploratory queries like "What are the best DeFi opportunities?" or "How can I earn on Solana?":
- Start with: "Great question! Let me help you discover the best opportunities on Solana."
- Present relevant options based on their question (usually Lending, Staking, and Trending Tokens for earning/opportunity queries)
- Explain briefly what each option does
- Ask which one interests them or what they'd like to explore first

EXAMPLE:
User: "What are the best DeFi opportunities on Solana?"
You: "Great question! Let me help you discover the best opportunities on Solana.

The Hive specializes in three main discovery strategies:

**Lending** - Earn high yields on stablecoins (USDC/USDT) by lending to DeFi protocols. Currently seeing rates of 13-16% APY on platforms like Kamino.

**Staking** - Stake your SOL to earn rewards (6-8% APY) and receive liquid staking tokens (LSTs) that you can use in other DeFi protocols.

**Trending Tokens** - Discover the hottest tokens on Solana right now with real-time trending data and trading activity.

Which interests you more - lending, staking, or finding trending tokens?"

Be conversational, helpful, and guide them toward The Hive's features. Once they express interest in a specific feature, the system will route them to the specialized agent.`;

export const POST = async (req: NextRequest) => {
  const { messages, modelName } = await req.json();

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

  const chosenAgent = await chooseAgent(model, truncatedMessages);

  let streamTextResult: StreamTextResult<Record<string, CoreTool<any, any>>, any>;
  if (!chosenAgent) {
    streamTextResult = streamText({
      model,
      messages: truncatedMessages,
      system,
    });
  } else {
    let agentSystem = chosenAgent.systemPrompt;

    if (chosenAgent.name === WALLET_AGENT_NAME) {
      agentSystem = `${agentSystem}

GLOBAL TOOL RESULT RULES:
- Do not restate or enumerate raw tool outputs that the UI already renders (such as detailed balance lists).
- For wallet balance tools, especially the "get all balances" action, follow your balance-display rules exactly and avoid bullet lists of individual token balances.

BUZZ, the native token of The Hive, is strictly a memecoin and has no utility.`;
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
   - Example: "Great! I'm showing you the lending interface. **What you're doing:** You're lending USDT at 16.49% APY..."

2. **status === 'complete'**: Transaction succeeded
   - Provide a success message confirming what was accomplished
   - Explain what they can do next
   - Example: "You're all set — your USDT is now lent! Your position is earning 16.49% APY..."

3. **status === 'cancelled'**: User cancelled the transaction
   - Acknowledge neutrally without making them feel bad
   - Example: "No problem! Let me know if you'd like to try again or if you have any questions."

4. **status === 'failed'**: Transaction failed
   - Acknowledge the failure
   - Offer help or suggest troubleshooting

IMPORTANT: Check the status field in tool results to provide contextually appropriate responses. Do NOT provide success messages when status is 'pending'.

BUZZ, the native token of The Hive, is strictly a memecoin and has no utility.`;
    }

    streamTextResult = streamText({
      model,
      tools: chosenAgent.tools,
      messages: truncatedMessages,
      system: agentSystem,
    });
  }

  return streamTextResult.toDataStreamResponse();
};
