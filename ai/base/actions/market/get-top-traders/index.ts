import { BASE_GET_TOP_TRADERS_NAME } from "./name";
import { BASE_GET_TOP_TRADERS_PROMPT } from "./prompt";
import { GetTopTradersInputSchema } from "./input-schema";
import { getTopTraders } from "./function";

import type { GetTopTradersResultBodyType } from "./types";
import type { BaseAction } from "../../base-action";

export class BaseGetTopTradersAction implements BaseAction<typeof GetTopTradersInputSchema, GetTopTradersResultBodyType> {
    public name = BASE_GET_TOP_TRADERS_NAME;
    public description = BASE_GET_TOP_TRADERS_PROMPT;
    public argsSchema = GetTopTradersInputSchema;
    public func = getTopTraders;
} 