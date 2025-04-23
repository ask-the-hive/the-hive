import { BASE_GET_KNOWLEDGE_NAME } from "./get-knowledge/name";
import { BaseGetKnowledgeAction } from "./get-knowledge";

export const BASE_KNOWLEDGE_ACTIONS = [
  new BaseGetKnowledgeAction()
];

export const BASE_KNOWLEDGE_ACTION_MAP = {
  [BASE_GET_KNOWLEDGE_NAME]: new BaseGetKnowledgeAction()
};

export * from "./knowledge-action";
export * from "./get-knowledge/name"; 