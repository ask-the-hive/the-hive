import { BASE_TRADING_AGENT_NAME } from "./name";
import { BASE_TRADING_AGENT_DESCRIPTION } from "./description";
import { BASE_TRADING_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_TRADING_TOOLS } from "./tools";
import type { Agent } from "@/ai/agent";

export const baseTradingAgent: Agent = {
    name: BASE_TRADING_AGENT_NAME,
    slug: "base-trading",
    systemPrompt: BASE_TRADING_AGENT_DESCRIPTION,
    capabilities: BASE_TRADING_AGENT_CAPABILITIES,
    tools: BASE_TRADING_TOOLS
}; 