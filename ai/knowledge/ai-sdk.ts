import { z } from "zod";

import { CoreTool, tool } from "ai";
import * as Sentry from '@sentry/nextjs';
import { sanitizeUserVisibleMessage, toUserFacingErrorText } from '@/lib/user-facing-error';

import { KNOWLEDGE_ACTIONS } from "./actions";

import type { KnowledgeAction, KnowledgeActionResult, KnowledgeActionSchemaAny } from "./actions";

export const knowledgeTool = <TActionSchema extends KnowledgeActionSchemaAny, TResultBody>(
    action: KnowledgeAction<TActionSchema, TResultBody>, 
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
            try {
                const result = await (func as ((args: z.infer<TActionSchema>) => Promise<KnowledgeActionResult<TResultBody>>))(args);
                return {
                    ...result,
                    message: sanitizeUserVisibleMessage(result?.message),
                } satisfies KnowledgeActionResult<TResultBody>;
            } catch (error) {
                Sentry.captureException(error);
                return {
                    message: toUserFacingErrorText(error),
                } satisfies KnowledgeActionResult<TResultBody>;
            }
        }
    });
}

export const knowledgeTools = () => KNOWLEDGE_ACTIONS.reduce((acc, action) => {
    acc[action.name] = knowledgeTool(action);
    return acc;
}, {} as Record<string, CoreTool>);
