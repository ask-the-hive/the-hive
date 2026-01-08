import { BASE_GET_KNOWLEDGE_NAME } from '@/ai/base-knowledge/actions/get-knowledge/name';
import { baseKnowledgeTool } from '@/ai/base-knowledge';
import { BaseGetKnowledgeAction } from '@/ai/base-knowledge/actions/get-knowledge';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BASE_KNOWLEDGE_TOOLS = {
  [`baseknowledge-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`baseknowledge-${BASE_GET_KNOWLEDGE_NAME}`]: baseKnowledgeTool(new BaseGetKnowledgeAction()),
};
