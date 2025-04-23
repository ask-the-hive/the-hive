import { BASE_ALL_BALANCES_NAME } from "./name";
import { BASE_ALL_BALANCES_PROMPT } from "./prompt";
import { AllBalancesInputSchema } from "./input-schema";
import { allBalances } from "./function";
import type { AllBalancesResultBodyType } from "./types";

import type { BaseAction } from "../../base-action";

export class BaseAllBalancesAction implements BaseAction<typeof AllBalancesInputSchema, AllBalancesResultBodyType> {
  public name = BASE_ALL_BALANCES_NAME;
  public description = BASE_ALL_BALANCES_PROMPT;
  public argsSchema = AllBalancesInputSchema;
  public func = allBalances;
} 