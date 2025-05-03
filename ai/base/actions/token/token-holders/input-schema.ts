import { z } from "zod";

export const TokenHoldersArgumentsSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the Base token to get holder count for. Must be a valid Base token."),
}); 