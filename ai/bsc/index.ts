import { z } from "zod";
import { tool } from "ai";

import type { BscAction } from "./actions/bsc-action";
import type { CoreTool } from "ai";

export const bscTool = <Schema extends z.ZodType<any, any>, ResultBody>(
  action: BscAction<Schema, ResultBody>
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
    execute: async (args) => {
      if (action.func) {
        const result = await action.func(args);
        return result;
      }
      return {
        message: "This action is not implemented yet.",
      };
    }
  });
}

export const bscTools = (actions: BscAction<any, any>[]) => actions.reduce((acc, action) => {
  acc[action.name] = bscTool(action);
  return acc;
}, {} as Record<string, CoreTool>); 