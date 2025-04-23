import { BaseGetTrendingTokensAction } from "@/ai/base/actions/market/get-trending-tokens";
import { BASE_GET_TRENDING_TOKENS_NAME } from "@/ai/base/actions/market/get-trending-tokens/name";
import { BaseGetTopTradersAction } from "@/ai/base/actions/market/get-top-traders";
import { BASE_GET_TOP_TRADERS_NAME } from "@/ai/base/actions/market/get-top-traders/name";
import { BaseGetTraderTradesAction } from "@/ai/base/actions/market/get-trades";
import { BASE_GET_TRADER_TRADES_NAME } from "@/ai/base/actions/market/get-trades/name";
import { baseTool } from "@/ai/base";

export const BASE_MARKET_TOOLS = {
    [`basemarket-${BASE_GET_TRENDING_TOKENS_NAME}`]: baseTool(new BaseGetTrendingTokensAction()),
    [`basemarket-${BASE_GET_TOP_TRADERS_NAME}`]: baseTool(new BaseGetTopTradersAction()),
    [`basemarket-${BASE_GET_TRADER_TRADES_NAME}`]: baseTool(new BaseGetTraderTradesAction()),
};