import { BASE_TOKEN_TOP_TRADERS_NAME } from "./name";
import { BASE_TOKEN_TOP_TRADERS_PROMPT } from "./prompt";
import { TopTokenTradersInputSchema } from "./input-schema";
import { TopTokenTradersResultBodyType } from "./types";
import { getTopTokenTraders } from "./function";

import type { BaseAction } from "../../base-action";

export class BaseTopTokenTradersAction implements BaseAction<typeof TopTokenTradersInputSchema, TopTokenTradersResultBodyType> {
  public name = BASE_TOKEN_TOP_TRADERS_NAME;
  public description = BASE_TOKEN_TOP_TRADERS_PROMPT;
  public argsSchema = TopTokenTradersInputSchema;
  public func = getTopTokenTraders;
} 