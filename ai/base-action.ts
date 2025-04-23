import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseActionSchemaAny = z.ZodObject<any, any, any, any>;

export type BaseActionResult<TBody> = {
    message: string;
    body?: TBody;
}

/**
 * Represents the base structure for all Actions.
 */
export interface BaseAction<TActionSchema extends BaseActionSchemaAny, TBody, TClient = void> {
  /**
   * The name of the action
   */
  name: string;

  /**
   * A description of what the action does
   */
  description: string;

  /**
   * Schema for validating action arguments
   */
  argsSchema: TActionSchema;

  /**
   * The function to execute for this action
   */
  func?:
    | ((args: z.infer<TActionSchema>, context?: any) => Promise<BaseActionResult<TBody>>)
    | ((client: TClient, args: z.infer<TActionSchema>, context?: any) => Promise<BaseActionResult<TBody>>)
} 

export interface BaseActionAny extends BaseAction<BaseActionSchemaAny, any, any> {}