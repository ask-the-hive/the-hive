import { BASE_GET_WALLET_ADDRESS_NAME } from "./name";
import { BASE_GET_WALLET_ADDRESS_PROMPT } from "./prompt";
import { GetWalletAddressInputSchema } from "./input-schema";

import type { GetWalletAddressResultBodyType } from "./types";
import type { BaseAction } from "../../base-action";

export class BaseGetWalletAddressAction implements BaseAction<typeof GetWalletAddressInputSchema, GetWalletAddressResultBodyType> {
    public name = BASE_GET_WALLET_ADDRESS_NAME;
    public description = BASE_GET_WALLET_ADDRESS_PROMPT;
    public argsSchema = GetWalletAddressInputSchema;
} 