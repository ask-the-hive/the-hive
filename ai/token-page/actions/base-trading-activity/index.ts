import { BASE_TOKEN_PAGE_TRADING_ACTIVITY_NAME } from "./name";
import { BASE_TOKEN_PAGE_TRADING_ACTIVITY_PROMPT } from "./prompt";
import { getBaseTokenPageTradingActivity, TokenPageTradingActivityArgumentsType, TokenPageTradingActivityResultBodyType } from "./function";

import { TokenPageAction } from "../token-page-action";

// Create a simple input schema for the trading activity function
import { z } from "zod";

// Renamed schema to avoid conflict with BSC version
export const BaseTokenPageTradingActivityInputSchema = z.object({});

export class BaseTokenPageTradingActivityAction implements TokenPageAction<typeof BaseTokenPageTradingActivityInputSchema, TokenPageTradingActivityResultBodyType> {
  public name = BASE_TOKEN_PAGE_TRADING_ACTIVITY_NAME;
  public description = BASE_TOKEN_PAGE_TRADING_ACTIVITY_PROMPT;
  public argsSchema = BaseTokenPageTradingActivityInputSchema;
  public func = getBaseTokenPageTradingActivity;
} 