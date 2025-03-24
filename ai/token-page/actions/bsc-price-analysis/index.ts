import { BSC_TOKEN_PAGE_PRICE_ANALYSIS_NAME } from "./name";
import { BSC_TOKEN_PAGE_PRICE_ANALYSIS_PROMPT } from "./prompt";
import { TokenPagePriceAnalysisInputSchema } from "../price-analysis/input-schema";
import { TokenPagePriceAnalysisResultBodyType } from "../price-analysis/types";
import { getBSCTokenPagePriceAnalysis } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BSCTokenPagePriceAnalysisAction implements TokenPageAction<typeof TokenPagePriceAnalysisInputSchema, TokenPagePriceAnalysisResultBodyType> {
  public name = BSC_TOKEN_PAGE_PRICE_ANALYSIS_NAME;
  public description = BSC_TOKEN_PAGE_PRICE_ANALYSIS_PROMPT;
  public argsSchema = TokenPagePriceAnalysisInputSchema;
  public func = getBSCTokenPagePriceAnalysis;
} 