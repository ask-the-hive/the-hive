import { z } from "zod";
import { tool } from "ai";

import type { BaseAction } from "./actions/base-action";
import type { CoreTool } from "ai";
import type { BaseActionSchemaAny } from "./actions/base-action";

export const baseTool = <Schema extends BaseActionSchemaAny, ResultBody>(
  action: BaseAction<Schema, ResultBody>
): CoreTool<any, any> => {
  if (!action.func) {
    return tool({
      description: action.description,
      parameters: action.argsSchema,
    });
  }
  
  return tool({
    description: action.description,
    parameters: action.argsSchema,
    execute: async (args, context) => {
      if (action.func) {
        const result = await action.func(args, context);
        return result;
      }
      return {
        message: "This action is not implemented yet.",
      };
    }
  });
}

export const baseTools = (actions: BaseAction<any, any>[]) => actions.reduce((acc, action) => {
  acc[action.name] = baseTool(action);
  return acc;
}, {} as Record<string, CoreTool>); 