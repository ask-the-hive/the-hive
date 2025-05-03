import { z } from "zod";

export const TradeInputSchema = z.object({
    inputAmount: z.number().positive().optional(),
    inputTokenAddress: z.string().optional(),
    outputTokenAddress: z.string().optional(),
    walletAddress: z.string(),
}); 