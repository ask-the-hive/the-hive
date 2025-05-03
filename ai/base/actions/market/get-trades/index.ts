import { BASE_GET_TRADER_TRADES_NAME } from "./name";
import { BASE_GET_TRADER_TRADES_PROMPT } from "./prompt";
import { GetTraderTradesInputSchema } from "./input-schema";
import { getTraderTrades } from "./function";

import type { GetTraderTradesResultBodyType } from "./types";
import type { BaseAction } from "../../base-action";

export class BaseGetTraderTradesAction implements BaseAction<typeof GetTraderTradesInputSchema, GetTraderTradesResultBodyType> {
    public name = BASE_GET_TRADER_TRADES_NAME;
    public description = BASE_GET_TRADER_TRADES_PROMPT;
    public argsSchema = GetTraderTradesInputSchema;
    public func = getTraderTrades;
} 