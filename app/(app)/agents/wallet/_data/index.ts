import { walletAgentInfo } from "./info";
import { walletAgentGraph } from "./graph";
import { walletAgentSampleQueries } from "./sample-queries";

import { Agent } from "../../_types/agent";

export const walletAgent: Agent = {
    info: walletAgentInfo,
    graph: walletAgentGraph,
    sampleQueries: walletAgentSampleQueries,
} 