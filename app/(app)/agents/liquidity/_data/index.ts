import { liquidityAgentInfo } from "./info";
import { liquidityAgentGraph } from "./graph";
import { liquidityAgentSampleQueries } from "./sample-queries";

import { Agent } from "../../_types/agent";

export const liquidityAgent: Agent = {
    info: liquidityAgentInfo,
    graph: liquidityAgentGraph,
    sampleQueries: liquidityAgentSampleQueries,
} 