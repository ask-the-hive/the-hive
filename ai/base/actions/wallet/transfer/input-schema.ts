import { z } from "zod";

export const TransferInputSchema = z.object({
    walletAddress: z.string().describe("The wallet address to transfer from"),
    to: z.string().describe("The recipient's wallet address"),
    amount: z.number().positive().describe("The amount to transfer"),
    tokenAddress: z.string().optional().describe("The token's contract address. If not provided, transfers ETH"),
    tokenSymbol: z.string().optional().describe("The token's symbol (e.g., 'USDC'). Will be used to look up the token address if tokenAddress is not provided")
}); 