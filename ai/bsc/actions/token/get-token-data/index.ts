import { BSC_GET_TOKEN_DATA_NAME } from "./name";
import { BSC_GET_TOKEN_DATA_PROMPT } from "./prompt";
import { GetTokenDataInputSchema } from "./input-schema";
import { getTokenData } from "./function";

import type { BscAction } from "../../bsc-action";
import type { GetTokenDataResultBodyType } from "./types";

export class BscGetTokenDataAction implements BscAction<typeof GetTokenDataInputSchema, GetTokenDataResultBodyType> {
  public name = BSC_GET_TOKEN_DATA_NAME;
  public description = BSC_GET_TOKEN_DATA_PROMPT;
  public argsSchema = GetTokenDataInputSchema;
  public func = getTokenData;
} 