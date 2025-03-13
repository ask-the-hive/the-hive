import { BSC_GET_KNOWLEDGE_NAME } from "@/ai/bsc-knowledge/actions/get-knowledge/name";
import { bscKnowledgeTool } from "@/ai/bsc-knowledge";
import { BscGetKnowledgeAction } from "@/ai/bsc-knowledge/actions/get-knowledge";

export const BSC_KNOWLEDGE_TOOLS = {
    [`bscknowledge-${BSC_GET_KNOWLEDGE_NAME}`]: bscKnowledgeTool(new BscGetKnowledgeAction())
} 