import { stakingAgentInfo } from "./info";
import { stakingAgentGraph } from "./graph";
import { stakingAgentSampleQueries } from "./sample-queries";

import { Agent } from "../../_types/agent";

export const stakingAgent: Agent = {
    info: stakingAgentInfo,
    graph: stakingAgentGraph,
    sampleQueries: stakingAgentSampleQueries,
} 