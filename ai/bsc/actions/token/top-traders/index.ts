import { BSC_TOKEN_TOP_TRADERS_NAME } from "./name";
import { BSC_TOKEN_TOP_TRADERS_PROMPT } from "./prompt";
import { TopTokenTradersInputSchema } from "./input-schema";
import { TopTokenTradersResultBodyType } from "./types";
import { getTopTokenTraders } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscTopTokenTradersAction implements BscAction<typeof TopTokenTradersInputSchema, TopTokenTradersResultBodyType> {
  public name = BSC_TOKEN_TOP_TRADERS_NAME;
  public description = BSC_TOKEN_TOP_TRADERS_PROMPT;
  public argsSchema = TopTokenTradersInputSchema;
  public func = getTopTokenTraders;
} 