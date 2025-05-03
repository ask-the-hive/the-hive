import { BASE_TOKEN_ANALYSIS_AGENT_NAME } from "./name";
import { BASE_TOKEN_ANALYSIS_AGENT_DESCRIPTION } from "./description";
import { BASE_TOKEN_ANALYSIS_AGENT_CAPABILITIES } from "./capabilities";
import { BASE_TOKEN_ANALYSIS_TOOLS } from "./tools";
import { Agent } from "@/ai/agent";

export class BaseTokenAnalysisAgent implements Agent {
    name = BASE_TOKEN_ANALYSIS_AGENT_NAME;
    slug = "base-token-analysis";
    systemPrompt = BASE_TOKEN_ANALYSIS_AGENT_DESCRIPTION;
    capabilities = BASE_TOKEN_ANALYSIS_AGENT_CAPABILITIES;
    tools = BASE_TOKEN_ANALYSIS_TOOLS;
}

export const baseTokenAnalysisAgent = new BaseTokenAnalysisAgent(); 