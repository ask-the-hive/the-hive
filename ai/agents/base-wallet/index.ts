import { BASE_WALLET_AGENT_NAME } from "./name";
import { BASE_WALLET_AGENT_DESCRIPTION } from "./description";
import { BASE_WALLET_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_WALLET_TOOLS } from "./tools";
import type { Agent } from "@/ai/agent";

export class BaseWalletAgent implements Agent {
    name = BASE_WALLET_AGENT_NAME;
    slug = "base-wallet";
    systemPrompt = BASE_WALLET_AGENT_DESCRIPTION;
    capabilities = BASE_WALLET_AGENT_CAPABILITIES;
    tools = BASE_WALLET_TOOLS;
}

export const baseWalletAgent = new BaseWalletAgent();

export default baseWalletAgent; 