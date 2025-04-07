import { BSC_ALL_BALANCES_NAME } from "./name";
import { BSC_ALL_BALANCES_PROMPT } from "./prompt";
import { AllBalancesInputSchema } from "./input-schema";
import { getAllBalances } from "./function";
import type { AllBalancesResultBodyType } from "./types";

import type { BscAction } from "../../bsc-action";

export class BscAllBalancesAction implements BscAction<typeof AllBalancesInputSchema, AllBalancesResultBodyType> {
  public name = BSC_ALL_BALANCES_NAME;
  public description = BSC_ALL_BALANCES_PROMPT;
  public argsSchema = AllBalancesInputSchema;
  public func = getAllBalances;
} 