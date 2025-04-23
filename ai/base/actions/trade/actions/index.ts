import { BASE_TRADE_NAME } from "./name";
import { BASE_TRADE_PROMPT } from "./prompt";
import { TradeInputSchema } from "./input-schema";
import { trade } from "./function";
import type { TradeResultBodyType } from "./types";
import type { BaseAction } from "@/ai/base-action";

export class BaseTradeAction implements BaseAction<typeof TradeInputSchema, TradeResultBodyType> {
    public name = BASE_TRADE_NAME;
    public description = BASE_TRADE_PROMPT;
    public argsSchema = TradeInputSchema;
    public func = trade;
}

export { TradeInputSchema, BASE_TRADE_NAME, BASE_TRADE_PROMPT }; 