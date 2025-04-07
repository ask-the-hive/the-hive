import { z } from "zod";

export const BubbleMapsArgumentsSchema = z.object({
    search: z.string().describe("The name, ticker, or contract address of the BSC token to get bubble map for. Must be a valid BSC token."),
}); 