import { YIELD_AGENT_CAPABILITIES } from './capabilities';
import { YIELD_AGENT_DESCRIPTION } from './description';
import { YIELD_AGENT_NAME } from './name';
import { YIELD_TOOLS } from './tools';

import type { Agent } from '@/ai/agent';

export const yieldAgent: Agent = {
  name: YIELD_AGENT_NAME,
  slug: 'yield',
  systemPrompt: YIELD_AGENT_DESCRIPTION,
  capabilities: YIELD_AGENT_CAPABILITIES,
  tools: YIELD_TOOLS,
};
