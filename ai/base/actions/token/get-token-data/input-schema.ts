import { z } from "zod";

export const GetTokenDataInputSchema = z.object({
  search: z.string().describe("The token address, name, or symbol to search for")
}); 