import { BaseAction, BaseActionResult, BaseActionSchemaAny } from "@/ai/base-action";

export type BscKnowledgeActionSchemaAny = BaseActionSchemaAny;
export type BscKnowledgeActionResult<TBody> = BaseActionResult<TBody>;

/**
 * Represents the structure for BSC Knowledge Actions.
 */
export interface BscKnowledgeAction<TActionSchema extends BscKnowledgeActionSchemaAny, TBody> extends BaseAction<TActionSchema, TBody> {} 