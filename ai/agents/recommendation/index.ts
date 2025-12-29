import type { Agent } from '@/ai/agent';

import { RECOMMENDATION_AGENT_CAPABILITIES } from './capabilities';
import { RECOMMENDATION_AGENT_DESCRIPTION } from './description';
import { RECOMMENDATION_AGENT_NAME } from './name';
import { RECOMMENDATION_TOOLS } from './tools';

export const recommendationAgent: Agent = {
  name: RECOMMENDATION_AGENT_NAME,
  slug: 'recommendation',
  systemPrompt: RECOMMENDATION_AGENT_DESCRIPTION,
  capabilities: RECOMMENDATION_AGENT_CAPABILITIES,
  tools: RECOMMENDATION_TOOLS,
};

