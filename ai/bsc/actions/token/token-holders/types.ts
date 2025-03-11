import { z } from "zod";

import { TokenHoldersInputSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";

export type TokenHoldersSchemaType = typeof TokenHoldersInputSchema;

export type TokenHoldersArgumentsType = z.infer<TokenHoldersSchemaType>;

export type TokenHoldersResultBodyType = {
    numHolders: number;
}; 

export type TokenHoldersResultType = BscActionResult<TokenHoldersResultBodyType>; 