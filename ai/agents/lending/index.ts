import { LENDING_AGENT_CAPABILITIES } from './capabilities';
import { LENDING_AGENT_DESCRIPTION } from './description';
import { LENDING_AGENT_NAME } from './name';
import { LENDING_TOOLS } from './tools';

import type { Agent } from '@/ai/agent';

export const lendingAgent: Agent = {
  name: LENDING_AGENT_NAME,
  slug: 'lending',
  systemPrompt: LENDING_AGENT_DESCRIPTION,
  capabilities: LENDING_AGENT_CAPABILITIES,
  tools: LENDING_TOOLS,
};
