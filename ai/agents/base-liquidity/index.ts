import { BASE_LIQUIDITY_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_LIQUIDITY_AGENT_DESCRIPTION } from "./description";
import { BASE_LIQUIDITY_AGENT_NAME } from "./name";
import { BASE_LIQUIDITY_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const baseLiquidityAgent: Agent = {
  name: BASE_LIQUIDITY_AGENT_NAME,
  slug: "base-liquidity",
  systemPrompt: BASE_LIQUIDITY_AGENT_DESCRIPTION,
  capabilities: BASE_LIQUIDITY_AGENT_CAPABILITIES.join("\n"),
  tools: BASE_LIQUIDITY_TOOLS
}; 