import { z } from "zod";

import { PriceChartInputSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";

export type PriceChartSchemaType = typeof PriceChartInputSchema;

export type PriceChartArgumentsType = z.infer<PriceChartSchemaType>;

export type PriceChartResultBodyType = {
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenLogo?: string;
};

export type PriceChartResultType = BscActionResult<PriceChartResultBodyType>; 