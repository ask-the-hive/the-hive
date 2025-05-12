import { BASE_TOKEN_PAGE_TOP_HOLDERS_NAME } from "./name";
import { BASE_TOKEN_PAGE_TOP_HOLDERS_PROMPT } from "./prompt";
import { TokenPageTopHoldersInputSchema } from "../top-holders/input-schema";
import { TokenPageTopHoldersResultBodyType } from "../top-holders/types";
import { getBaseTokenPageTopHolders } from "./function";

import type { TokenPageAction } from "../token-page-action";

export class BaseTokenPageTopHoldersAction implements TokenPageAction<typeof TokenPageTopHoldersInputSchema, TokenPageTopHoldersResultBodyType> {
  public name = BASE_TOKEN_PAGE_TOP_HOLDERS_NAME;
  public description = BASE_TOKEN_PAGE_TOP_HOLDERS_PROMPT;
  public argsSchema = TokenPageTopHoldersInputSchema;
  public func = getBaseTokenPageTopHolders;
} 