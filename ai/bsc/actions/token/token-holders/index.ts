import { BSC_TOKEN_HOLDERS_NAME } from "./name";
import { BSC_TOKEN_HOLDERS_PROMPT } from "./prompt";
import { TokenHoldersInputSchema } from "./input-schema";
import { TokenHoldersResultBodyType } from "./types";
import { getNumHolders } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscTokenHoldersAction implements BscAction<typeof TokenHoldersInputSchema, TokenHoldersResultBodyType> {
  public name = BSC_TOKEN_HOLDERS_NAME;
  public description = BSC_TOKEN_HOLDERS_PROMPT;
  public argsSchema = TokenHoldersInputSchema;
  public func = getNumHolders;
} 