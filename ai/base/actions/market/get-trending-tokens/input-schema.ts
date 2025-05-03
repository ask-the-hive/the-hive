import { z } from "zod";

export const GetTrendingTokensInputSchema = z.object({
    limit: z.number().optional(),
}); 