import { z } from "zod";

import { PriceChartArgumentsSchema } from "./input-schema";
import { BaseActionResult } from "../../base-action";

export type PriceChartSchemaType = typeof PriceChartArgumentsSchema;

export type PriceChartArgumentsType = z.infer<PriceChartSchemaType>;

export type PriceChartResultBodyType = {
    success: boolean;
    tokenAddress: string;
    tokenName?: string;
    tokenSymbol?: string;
    tokenLogo?: string;
};

export type PriceChartResultType = BaseActionResult<PriceChartResultBodyType>; 