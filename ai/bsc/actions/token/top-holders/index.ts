import { BSC_TOP_HOLDERS_NAME } from "./name";
import { BSC_TOP_HOLDERS_PROMPT } from "./prompt";
import { TopHoldersInputSchema } from "./input-schema";
import { TopHoldersResultBodyType } from "./types";
import { getTopHolders } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscTopHoldersAction implements BscAction<typeof TopHoldersInputSchema, TopHoldersResultBodyType> {
  public name = BSC_TOP_HOLDERS_NAME;
  public description = BSC_TOP_HOLDERS_PROMPT;
  public argsSchema = TopHoldersInputSchema;
  public func = getTopHolders;
} 