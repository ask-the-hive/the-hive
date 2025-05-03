import { z } from "zod";

export const TopHoldersInputSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the token to check top holders for."),
}); 