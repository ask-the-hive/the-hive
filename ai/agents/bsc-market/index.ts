import { BSC_MARKET_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_MARKET_AGENT_DESCRIPTION } from "./description";
import { BSC_MARKET_AGENT_NAME } from "./name";
import { BSC_MARKET_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const bscMarketAgent: Agent = {
    name: BSC_MARKET_AGENT_NAME,
    slug: "bsc-market",
    systemPrompt: BSC_MARKET_AGENT_DESCRIPTION,
    capabilities: BSC_MARKET_AGENT_CAPABILITIES,
    tools: BSC_MARKET_TOOLS
} 