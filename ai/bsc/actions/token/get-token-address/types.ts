import { z } from "zod";

import { GetTokenAddressArgumentsSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";

export type GetTokenAddressSchemaType = typeof GetTokenAddressArgumentsSchema;

export type GetTokenAddressArgumentsType = z.infer<GetTokenAddressSchemaType>;

export type GetTokenAddressResultBodyType = {
    address: string;
}; 

export type GetTokenAddressResultType = BscActionResult<GetTokenAddressResultBodyType>; 