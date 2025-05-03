import { z } from "zod";

import { BalanceInputSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";

export type BalanceSchemaType = typeof BalanceInputSchema;

export type BalanceArgumentsType = z.infer<BalanceSchemaType>;

export type BalanceResultBodyType = {
    balance: number;
    token: string;
    name: string;
    logoURI: string;
};

export type BalanceResultType = BaseActionResult<BalanceResultBodyType>; 