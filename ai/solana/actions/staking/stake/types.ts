import { z } from "zod";
import { StakeInputSchema } from "./input-schema";
import { SolanaActionResult } from "../../solana-action";
// QuoteResponse type for Jupiter lite API
type QuoteResponse = any;

export type StakeSchemaType = typeof StakeInputSchema;

export type StakeArgumentsType = z.infer<StakeSchemaType>;

export type StakeResultBodyType = {
    tx: string;
    symbol: string;
    quote?: QuoteResponse;
    amount?: number;
    contractAddress?: string;
} 

export type StakeResultType = SolanaActionResult<StakeResultBodyType>;