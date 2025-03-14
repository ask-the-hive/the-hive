import { BSC_TOKEN_PAGE_TRADING_ACTIVITY_NAME } from "./name";
import { BSC_TOKEN_PAGE_TRADING_ACTIVITY_PROMPT } from "./prompt";
import { getBSCTokenPageTradingActivity } from "./function";
import { TokenPageTradingActivityArgumentsType, TokenPageTradingActivityResultBodyType } from "./function";

import { TokenPageAction } from "../token-page-action";

// Create a simple input schema for the trading activity function
import { z } from "zod";

export const TokenPageTradingActivityInputSchema = z.object({});

export class BSCTokenPageTradingActivityAction implements TokenPageAction<typeof TokenPageTradingActivityInputSchema, TokenPageTradingActivityResultBodyType> {
  public name = BSC_TOKEN_PAGE_TRADING_ACTIVITY_NAME;
  public description = BSC_TOKEN_PAGE_TRADING_ACTIVITY_PROMPT;
  public argsSchema = TokenPageTradingActivityInputSchema;
  public func = getBSCTokenPageTradingActivity;
} 