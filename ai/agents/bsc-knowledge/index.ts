import { BSC_KNOWLEDGE_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_KNOWLEDGE_AGENT_DESCRIPTION } from "./description";
import { BSC_KNOWLEDGE_AGENT_NAME } from "./name";
import { BSC_KNOWLEDGE_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const bscKnowledgeAgent: Agent = {
    name: BSC_KNOWLEDGE_AGENT_NAME,
    slug: "bsc-knowledge",
    systemPrompt: BSC_KNOWLEDGE_AGENT_DESCRIPTION,
    capabilities: BSC_KNOWLEDGE_AGENT_CAPABILITIES,
    tools: BSC_KNOWLEDGE_TOOLS
} 