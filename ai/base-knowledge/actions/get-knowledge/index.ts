import { BASE_GET_KNOWLEDGE_NAME } from "./name";
import { BASE_GET_KNOWLEDGE_PROMPT } from "./prompt";
import { GetKnowledgeInputSchema } from "./input-schema";
import { GetKnowledgeResultBodyType } from "./types";
import { getKnowledgeFunction } from "./function";

import { BaseKnowledgeAction } from "../knowledge-action";

export class BaseGetKnowledgeAction implements BaseKnowledgeAction<typeof GetKnowledgeInputSchema, GetKnowledgeResultBodyType> {
  public name = BASE_GET_KNOWLEDGE_NAME;
  public description = BASE_GET_KNOWLEDGE_PROMPT;
  public argsSchema = GetKnowledgeInputSchema;
  public func = getKnowledgeFunction;
} 