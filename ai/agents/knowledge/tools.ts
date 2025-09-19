import { SEARCH_KNOWLEDGE_NAME } from '@/ai/action-names';
import { knowledgeTool } from '@/ai/knowledge';
import { SearchKnowledgeAction } from '@/ai/knowledge/actions/search-knowledge';

export const KNOWLEDGE_TOOLS = {
  [`knowledge-${SEARCH_KNOWLEDGE_NAME}`]: knowledgeTool(new SearchKnowledgeAction()),
};
