import { BASE_GET_TRENDING_TOKENS_NAME } from "./name";
import { BASE_GET_TRENDING_TOKENS_PROMPT } from "./prompt";
import { GetTrendingTokensInputSchema } from "./input-schema";
import { getTrendingTokens } from "./function";

import type { BaseAction } from "../../base-action";
import type { GetTrendingTokensResultBodyType } from "./types";

export class BaseGetTrendingTokensAction implements BaseAction<typeof GetTrendingTokensInputSchema, GetTrendingTokensResultBodyType> {
  public name = BASE_GET_TRENDING_TOKENS_NAME;
  public description = BASE_GET_TRENDING_TOKENS_PROMPT;
  public argsSchema = GetTrendingTokensInputSchema;
  public func = getTrendingTokens;
} 