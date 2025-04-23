import { z } from "zod";

import { TopHoldersInputSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";
import { TokenHolder } from "@/services/moralis";

export type TopHoldersSchemaType = typeof TopHoldersInputSchema;

export type TopHoldersArgumentsType = z.infer<typeof TopHoldersInputSchema>;

export type TopHoldersResultBodyType = {
    topHolders: TokenHolder[];
    totalPercentage: number;
};

export type TopHoldersResultType = BaseActionResult<TopHoldersResultBodyType>; 