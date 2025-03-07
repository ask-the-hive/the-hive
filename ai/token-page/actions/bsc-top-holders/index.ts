import { BSC_TOKEN_PAGE_TOP_HOLDERS_NAME } from "./name";
import { BSC_TOKEN_PAGE_TOP_HOLDERS_PROMPT } from "./prompt";
import { TokenPageTopHoldersInputSchema } from "../top-holders/input-schema";
import { TokenPageTopHoldersResultBodyType } from "../top-holders/types";
import { getBSCTokenPageTopHolders } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BSCTokenPageTopHoldersAction implements TokenPageAction<typeof TokenPageTopHoldersInputSchema, TokenPageTopHoldersResultBodyType> {
  public name = BSC_TOKEN_PAGE_TOP_HOLDERS_NAME;
  public description = BSC_TOKEN_PAGE_TOP_HOLDERS_PROMPT;
  public argsSchema = TokenPageTopHoldersInputSchema;
  public func = getBSCTokenPageTopHolders;
} 