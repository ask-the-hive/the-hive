import { z } from "zod";

import { CoreTool, tool } from "ai";

import { BASE_KNOWLEDGE_ACTIONS } from "./actions";

import type { BaseKnowledgeAction, BaseKnowledgeActionResult, BaseKnowledgeActionSchemaAny } from "./actions";

export const baseKnowledgeTool = <TActionSchema extends BaseKnowledgeActionSchemaAny, TResultBody>(
    action: BaseKnowledgeAction<TActionSchema, TResultBody>, 
) => {
    if (!action.func) {
        return tool({
            description: action.description,
            parameters: action.argsSchema,
        });
    }
    const func = action.func;
    return tool({
        description: action.description,
        parameters: action.argsSchema,
        execute: async (args) => {
            const result = await (func as ((args: z.infer<TActionSchema>) => Promise<BaseKnowledgeActionResult<TResultBody>>))(args);
            return result;
        }
    });
}

export const baseKnowledgeTools = () => BASE_KNOWLEDGE_ACTIONS.reduce((acc, action) => {
    acc[action.name] = baseKnowledgeTool(action);
    return acc;
}, {} as Record<string, CoreTool>); 