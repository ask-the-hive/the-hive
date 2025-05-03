import { BaseGetTrendingTokensAction } from "./get-trending-tokens";
import { BaseGetTopTradersAction } from "./get-top-traders";
import { BaseGetTraderTradesAction } from "./get-trades";

import type { BaseAction } from "../base-action";

export const BASE_MARKET_ACTIONS: BaseAction<any, any>[] = [
    new BaseGetTrendingTokensAction(),
    new BaseGetTopTradersAction(),
    new BaseGetTraderTradesAction(),
]; 