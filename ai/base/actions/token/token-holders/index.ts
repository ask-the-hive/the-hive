import { BASE_TOKEN_HOLDERS_NAME } from "./name";
import { BASE_TOKEN_HOLDERS_PROMPT } from "./prompt";
import { TokenHoldersArgumentsSchema } from "./input-schema";
import { getTokenHolders } from "./function";

import type { BaseAction } from "../../base-action";
import type { TokenHoldersResultBodyType } from "./types";

export class BaseTokenHoldersAction implements BaseAction<typeof TokenHoldersArgumentsSchema, TokenHoldersResultBodyType> {
    public name = BASE_TOKEN_HOLDERS_NAME;
    public description = BASE_TOKEN_HOLDERS_PROMPT;
    public argsSchema = TokenHoldersArgumentsSchema;
    public func = getTokenHolders;
} 