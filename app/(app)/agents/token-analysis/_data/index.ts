import { tokenAnalysisAgentInfo } from "./info";
import { tokenAnalysisAgentGraph } from "./graph";
import { tokenAnalysisAgentSampleQueries } from "./sample-queries";

import { Agent } from "../../_types/agent";

export const tokenAnalysisAgent: Agent = {
    info: tokenAnalysisAgentInfo,
    graph: tokenAnalysisAgentGraph,
    sampleQueries: tokenAnalysisAgentSampleQueries,
} 