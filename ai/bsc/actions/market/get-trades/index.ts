import { BSC_GET_TRADER_TRADES_NAME } from "./name";
import { BSC_GET_TRADER_TRADES_PROMPT } from "./prompt";
import { GetTraderTradesInputSchema } from "./input-schema";
import { getTraderTrades } from "./function";

import type { GetTraderTradesResultBodyType } from "./types";
import type { BscAction } from "../../bsc-action";

export class BscGetTraderTradesAction implements BscAction<typeof GetTraderTradesInputSchema, GetTraderTradesResultBodyType> {
  public name = BSC_GET_TRADER_TRADES_NAME;
  public description = BSC_GET_TRADER_TRADES_PROMPT;
  public argsSchema = GetTraderTradesInputSchema;
  public func = getTraderTrades;
} 