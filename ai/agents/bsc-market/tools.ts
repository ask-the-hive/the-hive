import { BscGetTrendingTokensAction } from "@/ai/bsc/actions/market/get-trending-tokens";
import { BSC_GET_TRENDING_TOKENS_NAME } from "@/ai/bsc/actions/market/get-trending-tokens/name";
import { BscGetTraderTradesAction } from "@/ai/bsc/actions/market/get-trades";
import { BSC_GET_TRADER_TRADES_NAME } from "@/ai/bsc/actions/market/get-trades/name";
import { bscTool } from "@/ai/bsc";

export const BSC_MARKET_TOOLS = {
    [`bscmarket-${BSC_GET_TRENDING_TOKENS_NAME}`]: bscTool(new BscGetTrendingTokensAction()),
    [`bscmarket-${BSC_GET_TRADER_TRADES_NAME}`]: bscTool(new BscGetTraderTradesAction()),
}; 