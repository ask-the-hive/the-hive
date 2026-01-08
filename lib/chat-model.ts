import { LanguageModelV1 } from 'ai';

import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';

import { Models } from '@/types/models';

export type ChatModelConfig = {
  model: LanguageModelV1;
  maxTokens: number;
};

export const getChatModelConfig = (modelName: string): ChatModelConfig => {
  if (modelName === Models.OpenAI) {
    return { model: openai('gpt-4o-mini'), maxTokens: 128000 };
  }

  if (modelName === Models.Anthropic) {
    return { model: anthropic('claude-3-5-sonnet-latest'), maxTokens: 190000 };
  }

  if (modelName === Models.XAI) {
    return { model: xai('grok-beta'), maxTokens: 131072 };
  }

  if (modelName === Models.Gemini) {
    return { model: google('gemini-2.0-flash-exp'), maxTokens: 1048576 };
  }

  if (modelName === Models.Deepseek) {
    return { model: deepseek('deepseek-chat') as LanguageModelV1, maxTokens: 64000 };
  }

  throw new Error('Invalid model');
};
