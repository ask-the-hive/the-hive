import { BSC_LIQUIDITY_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_LIQUIDITY_AGENT_DESCRIPTION } from "./description";
import { BSC_LIQUIDITY_AGENT_NAME } from "./name";
import { BSC_LIQUIDITY_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const bscLiquidityAgent: Agent = {
  name: BSC_LIQUIDITY_AGENT_NAME,
  slug: "bsc-liquidity",
  systemPrompt: BSC_LIQUIDITY_AGENT_DESCRIPTION,
  capabilities: BSC_LIQUIDITY_AGENT_CAPABILITIES.join("\n"),
  tools: BSC_LIQUIDITY_TOOLS
}; 