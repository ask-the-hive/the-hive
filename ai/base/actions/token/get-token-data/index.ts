import { BASE_GET_TOKEN_DATA_NAME } from "./name";
import { BASE_GET_TOKEN_DATA_PROMPT } from "./prompt";
import { GetTokenDataInputSchema } from "./input-schema";
import { getTokenData } from "./function";

import type { BaseAction } from "../../base-action";
import type { GetTokenDataResultBodyType } from "./types";

export class BaseGetTokenDataAction implements BaseAction<typeof GetTokenDataInputSchema, GetTokenDataResultBodyType> {
  public name = BASE_GET_TOKEN_DATA_NAME;
  public description = BASE_GET_TOKEN_DATA_PROMPT;
  public argsSchema = GetTokenDataInputSchema;
  public func = getTokenData;
} 