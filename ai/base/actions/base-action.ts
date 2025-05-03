import type { BaseAction as RootBaseAction, BaseActionResult as RootBaseActionResult, BaseActionSchemaAny as RootBaseActionSchemaAny } from "@/ai/base-action";

export type BaseActionSchemaAny = RootBaseActionSchemaAny;

export interface BaseAction<TActionSchema extends BaseActionSchemaAny, TBody> extends RootBaseAction<TActionSchema, TBody> {}

export type BaseActionResult<TBody> = RootBaseActionResult<TBody>; 