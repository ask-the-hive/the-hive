import { BASE_GET_KNOWLEDGE_NAME } from "@/ai/base-knowledge/actions/get-knowledge/name";
import { baseKnowledgeTool } from "@/ai/base-knowledge";
import { BaseGetKnowledgeAction } from "@/ai/base-knowledge/actions/get-knowledge";

export const BASE_KNOWLEDGE_TOOLS = {
    [`baseknowledge-${BASE_GET_KNOWLEDGE_NAME}`]: baseKnowledgeTool(new BaseGetKnowledgeAction())
} 