import { z } from "zod";

import { CoreTool, tool } from "ai";

import { BSC_KNOWLEDGE_ACTIONS } from "./actions";

import type { BscKnowledgeAction, BscKnowledgeActionResult, BscKnowledgeActionSchemaAny } from "./actions";

export const bscKnowledgeTool = <TActionSchema extends BscKnowledgeActionSchemaAny, TResultBody>(
    action: BscKnowledgeAction<TActionSchema, TResultBody>, 
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
            const result = await (func as ((args: z.infer<TActionSchema>) => Promise<BscKnowledgeActionResult<TResultBody>>))(args);
            return result;
        }
    });
}

export const bscKnowledgeTools = () => BSC_KNOWLEDGE_ACTIONS.reduce((acc, action) => {
    acc[action.name] = bscKnowledgeTool(action);
    return acc;
}, {} as Record<string, CoreTool>); 