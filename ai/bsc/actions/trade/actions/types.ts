import { z } from "zod";
import { TradeInputSchema } from "./input-schema";
import { BscActionResult } from "../../bsc-action";

export type TradeSchemaType = typeof TradeInputSchema;

export type TradeArgumentsType = z.infer<TradeSchemaType>;

export type TradeResultBodyType = {
    transaction: string;
    inputAmount: number;
    inputToken: string;
    outputToken: string;
    walletAddress: string;
    success?: boolean;
    error?: string;
}

export type TradeResultType = BscActionResult<TradeResultBodyType>; 