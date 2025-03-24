import { z } from "zod";

export const GetPoolsInputSchema = z.object({
    ticker: z.string().optional().describe("The ticker of the token to get data for"),
    address: z.string().optional().describe("The address of the token to get data for"),
}); 