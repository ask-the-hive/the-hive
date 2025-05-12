import { BASE_TOKEN_PAGE_PRICE_ANALYSIS_NAME } from "./name";
import { BASE_TOKEN_PAGE_PRICE_ANALYSIS_PROMPT } from "./prompt";
import { TokenPagePriceAnalysisInputSchema } from "../price-analysis/input-schema";
import { TokenPagePriceAnalysisResultBodyType } from "../price-analysis/types";
import { getBaseTokenPagePriceAnalysis } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BaseTokenPagePriceAnalysisAction implements TokenPageAction<typeof TokenPagePriceAnalysisInputSchema, TokenPagePriceAnalysisResultBodyType> {
  public name = BASE_TOKEN_PAGE_PRICE_ANALYSIS_NAME;
  public description = BASE_TOKEN_PAGE_PRICE_ANALYSIS_PROMPT;
  public argsSchema = TokenPagePriceAnalysisInputSchema;
  public func = getBaseTokenPagePriceAnalysis;
} 