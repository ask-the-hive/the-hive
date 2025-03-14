import { z } from "zod";

import { TopHoldersInputSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";
import { TokenHolder } from "@/services/moralis";

export type TopHoldersSchemaType = typeof TopHoldersInputSchema;

export type TopHoldersArgumentsType = z.infer<TopHoldersSchemaType>;

export type TopHoldersResultBodyType = {
    topHolders: TokenHolder[];
    totalPercentage: number;
}; 

export type TopHoldersResultType = BscActionResult<TopHoldersResultBodyType>; 