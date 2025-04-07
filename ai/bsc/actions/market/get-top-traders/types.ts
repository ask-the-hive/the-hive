import { z } from "zod";

import type { GetTopTradersInputSchema } from "./input-schema";
import type { BscActionResult } from "../../bsc-action";
import type { TopTrader } from "@/services/birdeye/types";

export type GetTopTradersSchemaType = typeof GetTopTradersInputSchema;

export type GetTopTradersArgumentsType = z.infer<GetTopTradersSchemaType>;

export type GetTopTradersResultBodyType = {
    traders: TopTrader[];
};

export type GetTopTradersResultType = BscActionResult<GetTopTradersResultBodyType>; 