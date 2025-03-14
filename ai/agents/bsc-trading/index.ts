import { BSC_TRADING_AGENT_NAME } from "./name";
import { BSC_TRADING_AGENT_DESCRIPTION } from "./description";
import { BSC_TRADING_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_TRADING_TOOLS } from "./tools";
import type { Agent } from "@/ai/agent";

export const bscTradingAgent: Agent = {
    name: BSC_TRADING_AGENT_NAME,
    slug: "bsc-trading",
    systemPrompt: BSC_TRADING_AGENT_DESCRIPTION,
    capabilities: BSC_TRADING_AGENT_CAPABILITIES,
    tools: BSC_TRADING_TOOLS
}; 