import { BSC_GET_KNOWLEDGE_NAME } from "./get-knowledge/name";
import { BscGetKnowledgeAction } from "./get-knowledge";

export const BSC_KNOWLEDGE_ACTIONS = [
  new BscGetKnowledgeAction()
];

export const BSC_KNOWLEDGE_ACTION_MAP = {
  [BSC_GET_KNOWLEDGE_NAME]: new BscGetKnowledgeAction()
};

export * from "./knowledge-action";
export * from "./get-knowledge/name"; 