import { z } from "zod";

export const GetTraderTradesInputSchema = z.object({
    address: z.string()
        .describe("The address of the trader to get the trades for"),
}); 