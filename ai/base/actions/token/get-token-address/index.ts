import { BASE_GET_TOKEN_ADDRESS_NAME } from "./name";
import { BASE_GET_TOKEN_ADDRESS_PROMPT } from "./prompt";
import { GetTokenAddressArgumentsSchema } from "./input-schema";
import { getTokenAddress } from "./function";

import type { BaseAction } from "../../base-action";
import type { GetTokenAddressResultBodyType } from "./types";

export class BaseGetTokenAddressAction implements BaseAction<typeof GetTokenAddressArgumentsSchema, GetTokenAddressResultBodyType> {
  public name = BASE_GET_TOKEN_ADDRESS_NAME;
  public description = BASE_GET_TOKEN_ADDRESS_PROMPT;
  public argsSchema = GetTokenAddressArgumentsSchema;
  public func = getTokenAddress;
} 