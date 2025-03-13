import { z } from "zod";

export const TransferInputSchema = z.object({
    to: z.string().describe("The recipient's wallet address"),
    amount: z.number().positive().describe("The amount to transfer"),
    tokenAddress: z.string().optional().describe("The token's contract address. If not provided, transfers BNB"),
    tokenSymbol: z.string().optional().describe("The token's symbol (e.g., 'CAKE'). Will be used to look up the token address if tokenAddress is not provided")
}); 