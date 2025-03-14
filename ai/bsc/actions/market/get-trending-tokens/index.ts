import { BSC_GET_TRENDING_TOKENS_NAME } from "./name";
import { BSC_GET_TRENDING_TOKENS_PROMPT } from "./prompt";
import { GetTrendingTokensInputSchema } from "./input-schema";
import { getTrendingTokens } from "./function";

import type { BscAction } from "../../bsc-action";
import type { GetTrendingTokensResultBodyType } from "./types";

export class BscGetTrendingTokensAction implements BscAction<typeof GetTrendingTokensInputSchema, GetTrendingTokensResultBodyType> {
  public name = BSC_GET_TRENDING_TOKENS_NAME;
  public description = BSC_GET_TRENDING_TOKENS_PROMPT;
  public argsSchema = GetTrendingTokensInputSchema;
  public func = getTrendingTokens;
} 