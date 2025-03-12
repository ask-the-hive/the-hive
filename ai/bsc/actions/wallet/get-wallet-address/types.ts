import { z } from "zod";

import type { GetWalletAddressInputSchema } from "./input-schema";
import type { BscActionResult } from "../../bsc-action";

export type GetWalletAddressSchemaType = typeof GetWalletAddressInputSchema;

export type GetWalletAddressArgumentsType = z.infer<GetWalletAddressSchemaType>;

export type GetWalletAddressResultBodyType = {
    address: string;
}

export type GetWalletAddressResultType = BscActionResult<GetWalletAddressResultBodyType>; 