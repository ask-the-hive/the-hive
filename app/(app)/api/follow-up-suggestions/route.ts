import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { Models } from '@/types/models';
import { generateObject } from 'ai';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/api-error-handler';

const defaultPrompt = `Generate 3 follow-up suggestions for what I can do next. They can be declarative or questions. The prompts should be specific to the previous messages. Reference specific tokens, projects, etc.`;

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { messages, modelName, prompt: userPrompt } = await req.json();

  const prompt = userPrompt || defaultPrompt;

  let model;
  switch (modelName) {
    case Models.OpenAI:
      model = openai('gpt-4o-mini');
      break;
    case Models.Anthropic:
      model = anthropic('claude-3-5-sonnet-latest');
      break;
    case Models.XAI:
      model = xai('grok-beta');
      break;
    case Models.Gemini:
      model = google('gemini-2.0-flash-exp');
      break;
    case Models.Deepseek:
      model = deepseek('deepseek-chat');
      break;
    default:
      throw new Error('Invalid model');
  }

  const { object } = await generateObject({
    model,
    messages: [
      ...messages,
      {
        role: 'user',
        content: prompt,
      },
    ],
    schema: z.object({
      suggestions: z.array(
        z.object({
          prompt: z.string().describe('A prompt for the suggestion.'),
          title: z
            .string()
            .describe('A short, concise and complete 3-5 word title for the suggestion'),
        }),
      ),
    }),
  });

  return NextResponse.json(object.suggestions);
});
