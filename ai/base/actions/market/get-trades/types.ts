import { z } from "zod";

import type { GetTraderTradesInputSchema } from "./input-schema";
import type { BaseActionResult } from "../../base-action";
import { Token } from "@/db/types";

export type TokenTraded = {
    token: Token;
    volume: {
        buy: number;
        sell: number;
    },
    balanceChange: number;
    usdChange: number;
}

export type GetTraderTradesSchemaType = typeof GetTraderTradesInputSchema;

export type GetTraderTradesArgumentsType = z.infer<GetTraderTradesSchemaType>;

export type GetTraderTradesResultBodyType = {
    tokensTraded: Record<string, TokenTraded>;
};

export type GetTraderTradesResultType = BaseActionResult<GetTraderTradesResultBodyType>; 