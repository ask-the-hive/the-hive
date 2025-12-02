import type { SearchKnowledgeArgumentsType, SearchKnowledgeResultType } from './types';

/**
 * Simplified fallback: skip knowledge DB lookups and let the LLM answer directly.
 * This prevents the Knowledge Agent from hanging when no library matches exist.
 */
export const searchKnowledgeFunction = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: SearchKnowledgeArgumentsType,
): Promise<SearchKnowledgeResultType> => {
  return {
    message:
      "No knowledge base lookup performed. Answer the user's question directly using your own reasoning.",
    body: {
      knowledge: [],
    },
  };
};
