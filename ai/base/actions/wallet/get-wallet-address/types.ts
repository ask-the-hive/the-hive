import { z } from "zod";

import type { GetWalletAddressInputSchema } from "./input-schema";
import type { BaseActionResult } from "../../base-action";

export type GetWalletAddressSchemaType = typeof GetWalletAddressInputSchema;

export type GetWalletAddressResultBodyType = {
    address: string;
}

export type GetWalletAddressResultType = BaseActionResult<GetWalletAddressResultBodyType>; 