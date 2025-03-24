import { z } from "zod";

import { GetPoolsInputSchema } from "./input-schema";

import type { BscActionResult } from "../../bsc-action";
import type { MoralisPair } from "@/services/moralis/get-token-pairs";

export type GetPoolsSchemaType = typeof GetPoolsInputSchema;

export type GetPoolsArgumentsType = z.infer<GetPoolsSchemaType>;

export type GetPoolsResultBodyType = {
    pools: MoralisPair[];
}; 

export type GetPoolsResultType = BscActionResult<GetPoolsResultBodyType>; 