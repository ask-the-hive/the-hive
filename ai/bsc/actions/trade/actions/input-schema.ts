import { z } from "zod";

export const TradeInputSchema = z.object({
    outputTokenAddress: z.string().optional().describe("The token address to receive."),
    inputAmount: z.number().positive().optional().describe("The amount of input token to swap"),
    inputTokenAddress: z.string().optional().describe("The token address to swap."),
    slippageBps: z.number().default(100).optional().describe("The slippage tolerance in basis points (e.g., 100 for 1%)"),
    walletAddress: z.string().describe("The wallet address to trade from"),
}); 