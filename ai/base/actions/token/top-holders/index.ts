import { BASE_TOP_HOLDERS_NAME } from "./name";
import { BASE_TOP_HOLDERS_PROMPT } from "./prompt";
import { TopHoldersInputSchema } from "./input-schema";
import { TopHoldersResultBodyType } from "./types";
import { getTopHolders } from "./function";

import type { BaseAction } from "../../base-action";

export class BaseTopHoldersAction implements BaseAction<typeof TopHoldersInputSchema, TopHoldersResultBodyType> {
  public name = BASE_TOP_HOLDERS_NAME;
  public description = BASE_TOP_HOLDERS_PROMPT;
  public argsSchema = TopHoldersInputSchema;
  public func = getTopHolders;
} 