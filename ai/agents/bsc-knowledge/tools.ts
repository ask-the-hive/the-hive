import { BSC_GET_KNOWLEDGE_NAME } from '@/ai/bsc-knowledge/actions/get-knowledge/name';
import { bscKnowledgeTool } from '@/ai/bsc-knowledge';
import { BscGetKnowledgeAction } from '@/ai/bsc-knowledge/actions/get-knowledge';
import { UI_DECISION_RESPONSE_NAME } from '@/ai/ui/decision-response/name';
import { decisionResponseTool } from '@/ai/ui/decision-response/tool';

export const BSC_KNOWLEDGE_TOOLS = {
  [`bscknowledge-${UI_DECISION_RESPONSE_NAME}`]: decisionResponseTool,
  [`bscknowledge-${BSC_GET_KNOWLEDGE_NAME}`]: bscKnowledgeTool(new BscGetKnowledgeAction()),
};
