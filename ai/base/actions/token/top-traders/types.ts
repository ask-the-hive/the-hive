import { z } from "zod";

import { TopTokenTradersInputSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";

import type { TopTraderByToken } from "@/services/birdeye/types";

export type TopTokenTradersSchemaType = typeof TopTokenTradersInputSchema;

export type TopTokenTradersArgumentsType = z.infer<TopTokenTradersSchemaType>;

export type TopTokenTradersResultBodyType = {
    topTraders: TopTraderByToken[];
}; 

export type TopTokenTradersResultType = BaseActionResult<TopTokenTradersResultBodyType>; 