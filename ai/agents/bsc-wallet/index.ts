import { BSC_WALLET_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_WALLET_AGENT_DESCRIPTION } from "./description";
import { BSC_WALLET_AGENT_NAME } from "./name";
import { BSC_WALLET_TOOLS } from "./tools";

import type { Agent } from "@/ai/agent";

export const bscWalletAgent: Agent = {
    name: BSC_WALLET_AGENT_NAME,
    slug: "bsc-wallet",
    systemPrompt: BSC_WALLET_AGENT_DESCRIPTION,
    capabilities: BSC_WALLET_AGENT_CAPABILITIES,
    tools: BSC_WALLET_TOOLS
} 