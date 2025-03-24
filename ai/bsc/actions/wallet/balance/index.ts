import { BSC_BALANCE_NAME } from "./name";
import { BSC_BALANCE_PROMPT } from "./prompt";
import { BalanceInputSchema } from "./input-schema";
import { BalanceResultBodyType } from "./types";
import { getBalance } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscBalanceAction implements BscAction<typeof BalanceInputSchema, BalanceResultBodyType> {
  public name = BSC_BALANCE_NAME;
  public description = BSC_BALANCE_PROMPT;
  public argsSchema = BalanceInputSchema;
  public func = getBalance;
} 