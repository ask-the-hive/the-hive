import { z } from "zod";
import { GetKnowledgeInputSchema } from "./input-schema";
import { BscKnowledgeActionResult } from "../knowledge-action";

export type GetKnowledgeArgumentsType = z.infer<typeof GetKnowledgeInputSchema>;

export interface GetKnowledgeResultBodyType {
  information: string;
  links?: {
    title: string;
    url: string;
  }[];
}

export type GetKnowledgeResultType = BscKnowledgeActionResult<GetKnowledgeResultBodyType>; 