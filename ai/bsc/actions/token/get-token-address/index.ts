import { BSC_GET_TOKEN_ADDRESS_NAME } from "./name";
import { BSC_GET_TOKEN_ADDRESS_PROMPT } from "./prompt";
import { GetTokenAddressArgumentsSchema } from "./input-schema";
import { getTokenAddress } from "./function";

import type { BscAction } from "../../bsc-action";
import type { GetTokenAddressResultBodyType } from "./types";

export class BscGetTokenAddressAction implements BscAction<typeof GetTokenAddressArgumentsSchema, GetTokenAddressResultBodyType> {
  public name = BSC_GET_TOKEN_ADDRESS_NAME;
  public description = BSC_GET_TOKEN_ADDRESS_PROMPT;
  public argsSchema = GetTokenAddressArgumentsSchema;
  public func = getTokenAddress;
} 