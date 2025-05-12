import { z } from "zod";

export const BubbleMapsArgumentsSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the Base token to get bubble map for. Must be a valid Base token."),
}); 