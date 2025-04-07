import { BSC_GET_WALLET_ADDRESS_NAME } from "./name";
import { BSC_GET_WALLET_ADDRESS_PROMPT } from "./prompt";
import { GetWalletAddressInputSchema } from "./input-schema";

import type { GetWalletAddressResultBodyType } from "./types";
import type { BscAction } from "../../bsc-action";

export class BscGetWalletAddressAction implements BscAction<typeof GetWalletAddressInputSchema, GetWalletAddressResultBodyType> {
    public name = BSC_GET_WALLET_ADDRESS_NAME;
    public description = BSC_GET_WALLET_ADDRESS_PROMPT;
    public argsSchema = GetWalletAddressInputSchema;
} 