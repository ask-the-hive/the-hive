import { BASE_MARKET_AGENT_NAME } from "./name";
import { BASE_MARKET_AGENT_DESCRIPTION } from "./description";
import { BASE_MARKET_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_MARKET_TOOLS } from "./tools";

import type { Agent } from "../../agent";

export class BaseMarketAgent implements Agent {
    public name = BASE_MARKET_AGENT_NAME;
    public slug = "basemarket";
    public systemPrompt = BASE_MARKET_AGENT_DESCRIPTION;
    public capabilities = BASE_MARKET_AGENT_CAPABILITIES;
    public tools = BASE_MARKET_TOOLS;
}

export const baseMarketAgent = new BaseMarketAgent(); 