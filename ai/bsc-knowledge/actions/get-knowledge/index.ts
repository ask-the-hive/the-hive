import { BSC_GET_KNOWLEDGE_NAME } from "./name";
import { BSC_GET_KNOWLEDGE_PROMPT } from "./prompt";
import { GetKnowledgeInputSchema } from "./input-schema";
import { GetKnowledgeResultBodyType } from "./types";
import { getKnowledgeFunction } from "./function";

import { BscKnowledgeAction } from "../knowledge-action";

export class BscGetKnowledgeAction implements BscKnowledgeAction<typeof GetKnowledgeInputSchema, GetKnowledgeResultBodyType> {
  public name = BSC_GET_KNOWLEDGE_NAME;
  public description = BSC_GET_KNOWLEDGE_PROMPT;
  public argsSchema = GetKnowledgeInputSchema;
  public func = getKnowledgeFunction;
} 