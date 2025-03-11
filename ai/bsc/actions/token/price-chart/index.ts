import { BSC_PRICE_CHART_NAME } from "./name";
import { BSC_PRICE_CHART_PROMPT } from "./prompt";
import { PriceChartInputSchema } from "./input-schema";
import { PriceChartResultBodyType } from "./types";
import { getPriceChart } from "./function";

import type { BscAction } from "../../bsc-action";

export class BscPriceChartAction implements BscAction<typeof PriceChartInputSchema, PriceChartResultBodyType> {
  public name = BSC_PRICE_CHART_NAME;
  public description = BSC_PRICE_CHART_PROMPT;
  public argsSchema = PriceChartInputSchema;
  public func = getPriceChart;
} 