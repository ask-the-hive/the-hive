import { z } from "zod";

export const TokenHoldersInputSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the token to get holders for."),
}); 