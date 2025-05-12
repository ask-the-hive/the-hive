import { BASE_KNOWLEDGE_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_KNOWLEDGE_AGENT_DESCRIPTION } from "./description";
import { BASE_KNOWLEDGE_AGENT_NAME } from "./name";
import { BASE_KNOWLEDGE_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const baseKnowledgeAgent: Agent = {
    name: BASE_KNOWLEDGE_AGENT_NAME,
    slug: "base-knowledge",
    systemPrompt: BASE_KNOWLEDGE_AGENT_DESCRIPTION,
    capabilities: BASE_KNOWLEDGE_AGENT_CAPABILITIES,
    tools: BASE_KNOWLEDGE_TOOLS
} 