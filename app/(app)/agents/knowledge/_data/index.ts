import { knowledgeAgentInfo } from "./info";
import { knowledgeAgentGraph } from "./graph";
import { knowledgeAgentSampleQueries } from "./sample-queries";

import { Agent } from "../../_types/agent";

export const knowledgeAgent: Agent = {
    info: knowledgeAgentInfo,
    graph: knowledgeAgentGraph,
    sampleQueries: knowledgeAgentSampleQueries,
} 