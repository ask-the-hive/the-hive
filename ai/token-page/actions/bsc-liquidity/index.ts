import { BSC_TOKEN_PAGE_LIQUIDITY_NAME } from "./name";
import { BSC_TOKEN_PAGE_LIQUIDITY_PROMPT } from "./prompt";
import { TokenPageLiquidityInputSchema } from "../liquidity/input-schema";
import { TokenPageLiquidityResultBodyType } from "../liquidity/types";
import { getBSCTokenPageLiquidity } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BSCTokenPageLiquidityAction implements TokenPageAction<typeof TokenPageLiquidityInputSchema, TokenPageLiquidityResultBodyType> {
  public name = BSC_TOKEN_PAGE_LIQUIDITY_NAME;
  public description = BSC_TOKEN_PAGE_LIQUIDITY_PROMPT;
  public argsSchema = TokenPageLiquidityInputSchema;
  public func = getBSCTokenPageLiquidity;
} 