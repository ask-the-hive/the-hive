import { z } from "zod";

import { TokenHoldersArgumentsSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";

export type TokenHoldersSchemaType = typeof TokenHoldersArgumentsSchema;

export type TokenHoldersArgumentsType = z.infer<TokenHoldersSchemaType>;

export type TokenHoldersResultBodyType = {
    success: boolean;
    tokenName?: string;
    tokenSymbol?: string;
    tokenLogo?: string;
    holderCount: number;
};

export type TokenHoldersResultType = BaseActionResult<TokenHoldersResultBodyType>; 