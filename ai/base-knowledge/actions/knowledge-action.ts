import { BaseAction, BaseActionResult, BaseActionSchemaAny } from "@/ai/base-action";

export type BaseKnowledgeActionSchemaAny = BaseActionSchemaAny;
export type BaseKnowledgeActionResult<TBody> = BaseActionResult<TBody>;

/**
 * Represents the structure for Base Knowledge Actions.
 */
export interface BaseKnowledgeAction<TActionSchema extends BaseKnowledgeActionSchemaAny, TBody> extends BaseAction<TActionSchema, TBody> {} 