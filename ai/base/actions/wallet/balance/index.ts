import { BASE_BALANCE_NAME } from "./name";
import { BASE_BALANCE_PROMPT } from "./prompt";
import { BalanceInputSchema } from "./input-schema";
import { BalanceResultBodyType } from "./types";
import { getBalance } from "./function";

import type { BaseAction } from "../../base-action";

export class BaseBalanceAction implements BaseAction<typeof BalanceInputSchema, BalanceResultBodyType> {
  public name = BASE_BALANCE_NAME;
  public description = BASE_BALANCE_PROMPT;
  public argsSchema = BalanceInputSchema;
  public func = getBalance;
} 