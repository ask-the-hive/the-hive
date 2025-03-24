import { BscGetTrendingTokensAction } from "./get-trending-tokens";
import { BscGetTraderTradesAction } from "./get-trades";
import { BscGetTopTradersAction } from "./get-top-traders";

export * from "./get-trending-tokens";
export * from "./get-trades";
export * from './get-top-traders';

export const bscMarketActions = [
    new BscGetTrendingTokensAction(),
    new BscGetTraderTradesAction(),
    new BscGetTopTradersAction(),
]; 