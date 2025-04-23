import { BASE_PRICE_CHART_NAME } from "./name";
import { BASE_PRICE_CHART_PROMPT } from "./prompt";
import { PriceChartArgumentsSchema } from "./input-schema";
import { getPriceChart } from "./function";

import type { BaseAction } from "../../base-action";
import type { PriceChartResultBodyType } from "./types";

export class BaseGetPriceChartAction implements BaseAction<typeof PriceChartArgumentsSchema, PriceChartResultBodyType> {
    public name = BASE_PRICE_CHART_NAME;
    public description = BASE_PRICE_CHART_PROMPT;
    public argsSchema = PriceChartArgumentsSchema;
    public func = getPriceChart;
} 