import { Agent } from "@/ai/agent";

import { BSC_TOKEN_ANALYSIS_AGENT_NAME, BSC_TOKEN_ANALYSIS_AGENT_SLUG } from "./name";
import { BSC_TOKEN_ANALYSIS_AGENT_CAPABILITIES } from "./capabilities";
import { BSC_TOKEN_ANALYSIS_AGENT_DESCRIPTION } from "./description";
import { BSC_TOKEN_ANALYSIS_TOOLS } from "./tools";

export class BscTokenAnalysisAgent implements Agent {
  public name = BSC_TOKEN_ANALYSIS_AGENT_NAME;
  public slug = BSC_TOKEN_ANALYSIS_AGENT_SLUG;
  public capabilities = BSC_TOKEN_ANALYSIS_AGENT_CAPABILITIES;
  public systemPrompt = BSC_TOKEN_ANALYSIS_AGENT_DESCRIPTION;
  public tools = BSC_TOKEN_ANALYSIS_TOOLS;
}

export const bscTokenAnalysisAgent = new BscTokenAnalysisAgent(); 