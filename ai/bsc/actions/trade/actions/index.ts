import { BSC_TRADE_NAME } from "./name";
import { BSC_TRADE_PROMPT } from "./prompt";
import { TradeInputSchema } from "./input-schema";
import { trade } from "./function";
import type { TradeResultBodyType } from "./types";
import type { BscAction } from "../../bsc-action";

export class BscTradeAction implements BscAction<typeof TradeInputSchema, TradeResultBodyType> {
    public name = BSC_TRADE_NAME;
    public description = BSC_TRADE_PROMPT;
    public argsSchema = TradeInputSchema;
    public func = trade;
} 