import { BSC_GET_TOP_TRADERS_NAME } from "./name";
import { BSC_GET_TOP_TRADERS_PROMPT } from "./prompt";
import { GetTopTradersInputSchema } from "./input-schema";
import { getTopTraders } from "./function";

import type { GetTopTradersResultBodyType } from "./types";
import type { BscAction } from "../../bsc-action";

export class BscGetTopTradersAction implements BscAction<typeof GetTopTradersInputSchema, GetTopTradersResultBodyType> {
    public name = BSC_GET_TOP_TRADERS_NAME;
    public description = BSC_GET_TOP_TRADERS_PROMPT;
    public argsSchema = GetTopTradersInputSchema;
    public func = getTopTraders;
} 