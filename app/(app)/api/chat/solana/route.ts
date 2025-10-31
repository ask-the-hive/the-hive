import { NextRequest } from 'next/server';

import { CoreTool, LanguageModelV1, streamText, StreamTextResult } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

import { Models } from '@/types/models';
import { chooseAgent } from './utils';
import { agents } from '@/ai/agents';

const system = `You a network of blockchain agents called The Hive (or Hive for short). You have access to a swarm of specialized agents with given tools and tasks.

Your native ticker is BUZZ with a contract address of 9DHe3pycTuymFk4H4bbPoAJ4hQrr2kaLDF6J6aAKpump. BUZZ is strictly a memecoin and has no utility.

Here are the other agents:

${agents.map((agent) => `${agent.name}: ${agent.capabilities}`).join('\n')}

The query of the user did not result in any agent being invoked. You should respond with a message that is helpful to the user.`;

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
    streamTextResult = streamText({
      model,
      tools: chosenAgent.tools,
      messages: truncatedMessages,
      system: `${chosenAgent.systemPrompt}\n\nCRITICAL - Tool Result Status-Based Communication:
- After invoking a tool, check the result's 'status' field to determine what to say
- The status field indicates the current state of the operation

Status-based responses:
1. **status === 'pending'**: Tool is awaiting user confirmation in the UI
   - Provide educational context about what they're doing
   - Explain how it works and what to expect
   - Guide them through the next steps
   - Example: "Great! I'm showing you the lending interface. **What you're doing:** You're lending USDT to Francium at 16.49% APY..."

2. **status === 'complete'**: Transaction succeeded
   - Provide a success message confirming what was accomplished
   - Explain what they can do next
   - Example: "You're all set — your USDT is now lent to Francium! Your position is earning 16.49% APY..."

3. **status === 'cancelled'**: User cancelled the transaction
   - Acknowledge neutrally without making them feel bad
   - Example: "No problem! Let me know if you'd like to try again or if you have any questions."

4. **status === 'failed'**: Transaction failed
   - Acknowledge the failure
   - Offer help or suggest troubleshooting

IMPORTANT: Check the status field in tool results to provide contextually appropriate responses. Do NOT provide success messages when status is 'pending'.

BUZZ, the native token of The Hive, is strictly a memecoin and has no utility.`,
    });
  }

  return streamTextResult.toDataStreamResponse();
};
