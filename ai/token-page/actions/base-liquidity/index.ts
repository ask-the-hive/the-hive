import { BASE_TOKEN_PAGE_LIQUIDITY_NAME } from "./name";
import { BASE_TOKEN_PAGE_LIQUIDITY_PROMPT } from "./prompt";
import { TokenPageLiquidityInputSchema } from "../liquidity/input-schema";
import { TokenPageLiquidityResultBodyType } from "../liquidity/types";
import { getBaseTokenPageLiquidity } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BaseTokenPageLiquidityAction implements TokenPageAction<typeof TokenPageLiquidityInputSchema, TokenPageLiquidityResultBodyType> {
  public name = BASE_TOKEN_PAGE_LIQUIDITY_NAME;
  public description = BASE_TOKEN_PAGE_LIQUIDITY_PROMPT;
  public argsSchema = TokenPageLiquidityInputSchema;
  public func = getBaseTokenPageLiquidity;
} 