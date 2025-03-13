import { z } from "zod";

export const GetKnowledgeInputSchema = z.object({
  query: z.string().describe("The user's question or topic of interest related to BSC")
}); 